"""Build data/combined/: the Garbage Dataset plus extra public datasets, mapped onto one
set of fine classes (see bins.py), with duplicate images removed.

    python import_data.py              # all sources
    python import_data.py --cap 1000   # at most 1000 images per (source, class)
    python import_data.py --skip realwaste

Files are named <source>__<original>.jpg so train.py can report accuracy per source.
"""
import argparse
import http.client
import os
import shutil
import urllib.request
import zipfile
from collections import Counter, defaultdict
from multiprocessing import Pool
from pathlib import Path

import kagglehub
from PIL import Image

from bins import BIN_OF

ROOT = Path(__file__).parent
RAW = ROOT / "data/raw"
MAX_SIDE = 384

# Each source: how to fetch it, and {source folder name: our fine class}.
# Folders not listed are skipped (ambiguous for Seattle rules, e.g. paper cups).
SOURCES = {
    "gd": dict(
        name="The Garbage Dataset (arXiv:2602.10500)",
        license="see Kaggle page",
        kaggle="sumn2u/garbage-classification-v2",
        subdir="standardized_384",
        classes={c: c for c in ["battery", "biological", "cardboard", "clothes", "glass",
                                "metal", "paper", "plastic", "shoes", "trash"]},
    ),
    "hw": dict(
        name="Recyclable and Household Waste Classification",
        license="see Kaggle page",
        kaggle="alistairking/recyclable-and-household-waste-classification",
        subdir="images/images",
        classes={
            "aerosol_cans": "metal",
            "aluminum_food_cans": "metal",
            "aluminum_soda_cans": "metal",
            "steel_food_cans": "metal",
            "cardboard_boxes": "cardboard",
            "cardboard_packaging": "cardboard",
            "clothing": "clothes",
            "shoes": "shoes",
            "coffee_grounds": "biological",
            "eggshells": "biological",
            "food_waste": "biological",
            "tea_bags": "biological",
            "glass_beverage_bottles": "glass",
            "glass_cosmetic_containers": "glass",
            "glass_food_jars": "glass",
            "magazines": "paper",
            "newspaper": "paper",
            "office_paper": "paper",
            "plastic_cup_lids": "plastic",
            "plastic_detergent_bottles": "plastic",
            "plastic_food_containers": "plastic",
            "plastic_soda_bottles": "plastic",
            "plastic_water_bottles": "plastic",
            "plastic_shopping_bags": "plastic_bag",
            "plastic_trash_bags": "plastic_bag",
            "styrofoam_cups": "styrofoam",
            "styrofoam_food_containers": "styrofoam",
            "disposable_plastic_cutlery": "trash",
            "plastic_straws": "trash",
        },
    ),
    "rw": dict(
        name="RealWaste (Single & Kirkland, Information 2023)",
        license="CC BY-NC-SA 4.0 (non-commercial)",
        url="https://archive.ics.uci.edu/static/public/908/realwaste.zip",
        subdir="realwaste-main/RealWaste",
        classes={
            "Cardboard": "cardboard",
            "Food Organics": "biological",
            "Vegetation": "biological",
            "Glass": "glass",
            "Metal": "metal",
            "Paper": "paper",
            "Plastic": "plastic",
            "Miscellaneous Trash": "trash",
            "Textile Trash": "clothes",
        },
    ),
    # Edge Hill's Waste Classification Dataset is a cleaned copy of this one. Only the
    # organic half is used: its "recyclable" half also contains non-recyclables.
    "eh": dict(
        name="Waste Classification Data (Sekar; cleaned by Edge Hill Univ., doi:10.17632/n3gtgm9jxj)",
        license="CC BY 4.0",
        kaggle="techsash/waste-classification-data",
        subdir="DATASET",
        classes={"TRAIN/O": "biological", "TEST/O": "biological"},
    ),
}
IMG_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def fetch(key, src):
    if "kaggle" in src:
        return Path(kagglehub.dataset_download(src["kaggle"])) / src["subdir"]
    dest = RAW / key
    if not (dest / src["subdir"]).exists():
        dest.mkdir(parents=True, exist_ok=True)
        zpath = dest / "download.zip"
        download(src["url"], zpath)
        zipfile.ZipFile(zpath).extractall(dest)
        zpath.unlink()
    return dest / src["subdir"]


def download(url, path, tries=5):
    """Stream to disk, resuming with HTTP Range if the connection drops."""
    for attempt in range(tries):
        have = path.stat().st_size if path.exists() else 0
        req = urllib.request.Request(url, headers={"Range": f"bytes={have}-"} if have else {})
        print(f"downloading {url}" + (f" (resuming at {have >> 20} MB)" if have else ""), flush=True)
        try:
            with urllib.request.urlopen(req) as r, open(path, "ab" if r.status == 206 else "wb") as f:
                shutil.copyfileobj(r, f, 1 << 20)
            return
        except (OSError, http.client.HTTPException) as e:
            print(f"  interrupted: {e!r}", flush=True)
    raise SystemExit(f"download failed after {tries} tries: {url}")


def dhash(img, size=16):
    """256-bit difference hash: survives resizing and re-encoding; 64-bit collides on
    plain white-background studio shots."""
    g = img.convert("L").resize((size + 1, size), Image.BILINEAR)
    px = list(g.getdata())
    bits = 0
    for row in range(size):
        for col in range(size):
            i = row * (size + 1) + col
            bits = bits << 1 | (px[i] > px[i + 1])
    return bits


def hash_file(path):
    try:
        with Image.open(path) as im:
            return path, dhash(im)
    except Exception:
        return path, None


def write_image(job):
    src_path, out_path, link = job
    if link:
        try:
            os.link(src_path, out_path)
            return
        except OSError:
            pass
    with Image.open(src_path) as im:
        im = im.convert("RGB")
        if max(im.size) > MAX_SIDE:
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        im.save(out_path, "JPEG", quality=92)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=ROOT / "data/combined")
    ap.add_argument("--cap", type=int, default=1500, help="max images per (source, class); 0 = no cap")
    ap.add_argument("--skip", nargs="*", default=[], choices=list(SOURCES))
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()

    for src in SOURCES.values():
        unknown = set(src["classes"].values()) - set(BIN_OF)
        assert not unknown, f"add {unknown} to BIN_OF in bins.py"

    # 1. Collect (source, our class, file), capped per source/class with a fixed order.
    items = []
    for key, src in SOURCES.items():
        if key in args.skip:
            continue
        base = fetch(key, src)
        per_class = defaultdict(list)
        for folder, cls in src["classes"].items():
            files = sorted(p for p in (base / folder).rglob("*") if p.suffix.lower() in IMG_EXT)
            assert files, f"no images in {base / folder}"
            per_class[cls] += files
        for cls, files in per_class.items():
            if args.cap and len(files) > args.cap:
                step = len(files) / args.cap  # spread evenly across sub-folders
                files = [files[int(i * step)] for i in range(args.cap)]
            items += [(key, cls, f) for f in files]
        print(f"{key}: {sum(len(v) for v in per_class.values())} images found")

    # 2. Hash everything; keep the first copy of each image (gd first, so the
    #    benchmark's own images are never displaced).
    with Pool(args.workers) as pool:
        hashes = dict(pool.map(hash_file, [f for _, _, f in items], chunksize=64))
    seen, keep = {}, []
    dropped = Counter()
    for key, cls, f in items:
        h = hashes[f]
        if h is None:
            dropped[(key, "unreadable")] += 1
        elif h in seen:
            dropped[(key, f"duplicate of {seen[h]}")] += 1
        else:
            seen[h] = key
            keep.append((key, cls, f))
    for (key, why), n in sorted(dropped.items()):
        print(f"  dropped {n:5d} from {key}: {why}")

    # 3. Write data/combined/<class>/<source>__<name>.jpg
    if args.out.exists():
        shutil.rmtree(args.out)
    jobs, names = [], set()
    for key, cls, f in keep:
        (args.out / cls).mkdir(parents=True, exist_ok=True)
        stem = f"{key}__" + "_".join(f.with_suffix("").parts[-3:]).replace(" ", "_")
        link = key == "gd" and f.suffix.lower() == ".jpg"
        out = args.out / cls / (stem + (f.suffix.lower() if link else ".jpg"))
        assert out not in names, out
        names.add(out)
        jobs.append((f, out, link))
    with Pool(args.workers) as pool:
        pool.map(write_image, jobs, chunksize=64)

    counts = Counter((cls, key) for key, cls, _ in keep)
    classes = sorted({c for c, _ in counts})
    keys = [k for k in SOURCES if k not in args.skip]
    print(f"\n{'class':>12s} {'bin':>10s}" + "".join(f"{k:>7s}" for k in keys) + "  total")
    for c in classes:
        row = [counts[(c, k)] for k in keys]
        print(f"{c:>12s} {BIN_OF[c]:>10s}" + "".join(f"{n:>7d}" for n in row) + f"  {sum(row):5d}")
    print(f"{'':>23s}" + "".join(f"{sum(counts[(c, k)] for c in classes):>7d}" for k in keys) + f"  {len(keep):5d}")

    with open(args.out / "SOURCES.md", "w", encoding="utf-8") as fh:
        fh.write("# Sources\n\nImages were resized and relabeled to One Bin's classes.\n\n")
        for k in keys:
            fh.write(f"- `{k}__*`: {SOURCES[k]['name']}. License: {SOURCES[k]['license']}.\n")
    print(f"\nwrote {args.out}")


if __name__ == "__main__":
    main()
