"""Build data/combined/: the Garbage Dataset plus extra public datasets, mapped onto one
set of fine classes (see bins.py), with duplicate images removed.

    python import_data.py              # all sources
    python import_data.py --cap 1000   # at most 1000 images per (source, class)
    python import_data.py --skip realwaste
    python import_data.py --skip taco     # without TACO crops (needs prepare_taco.py)

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
        name="RealWaste (Single, Iranmanesh & Raad, Information 14(12):633, 2023)",
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

# TACO (built by prepare_taco.py): crops of each annotated item, mapped with Seattle rules.
# Categories not listed are skipped as ambiguous (small lids, "Other plastic", coated
# paper bags, pizza boxes, paper straws, "Unlabeled litter").
TACO_MAP = {
    "Aluminium foil": "metal", "Scrap metal": "metal",
    "Aerosol": "metal", "Drink can": "metal", "Food Can": "metal",
    "Battery": "battery",
    "Clear plastic bottle": "plastic", "Other plastic bottle": "plastic",
    "Disposable plastic cup": "plastic", "Other plastic cup": "plastic",
    "Disposable food container": "plastic", "Other plastic container": "plastic",
    "Spread tub": "plastic", "Tupperware": "plastic",
    "Glass bottle": "glass", "Glass jar": "glass",
    "Corrugated carton": "cardboard", "Egg carton": "cardboard", "Toilet tube": "cardboard",
    "Drink carton": "cardboard", "Meal carton": "cardboard", "Other carton": "cardboard",
    "Normal paper": "paper", "Magazine paper": "paper", "Wrapping paper": "paper",
    "Paper bag": "paper",
    "Paper cup": "paper",  # recycling unless marked compostable -- not visible in photos
    "Tissues": "tissue",
    "Food waste": "biological",
    "Crisp packet": "plastic_bag", "Other plastic wrapper": "plastic_bag",
    "Plastic film": "plastic_bag", "Garbage bag": "plastic_bag",
    "Polypropylene bag": "plastic_bag", "Single-use carrier bag": "plastic_bag",
    "Foam cup": "styrofoam", "Foam food container": "styrofoam", "Styrofoam piece": "styrofoam",
    "Shoe": "shoes",
    # Seattle: loose items under ~3 in jam sorting machines -> garbage
    "Metal bottle cap": "trash", "Plastic bottle cap": "trash", "Pop tab": "trash",
    "Broken glass": "trash", "Glass cup": "trash",
    "Cigarette": "trash", "Plastic glooves": "trash", "Plastic utensils": "trash",
    "Plastic straw": "trash", "Rope & strings": "trash", "Six pack rings": "trash",
    "Squeezable tube": "trash", "Aluminium blister pack": "trash", "Carded blister pack": "trash",
}
TACO_CAPS = {"Cigarette": 300}  # mostly tiny butts; don't let them swamp "trash"
TACO_MIN_SIDE = 32  # px in the 1024px images; smaller crops are unreadable
TACO_PAD = 0.1      # same context padding sorter.py uses at inference
TACO_SPLITS = ["train", "val", "test"]
SOURCES["taco"] = dict(
    name="TACO: Trash Annotations in Context (Proença & Simões, arXiv:2003.06975), item crops",
    license="CC BY 4.0",
    crops=True,
    subdir="",
    # <split>/<class>/ folders; the split is kept so TACO test photos stay test-only
    classes={f"{s}/{c}": c for s in TACO_SPLITS for c in sorted(set(TACO_MAP.values()))},
)


def build_taco_crops(dest):
    """Crop every mapped TACO annotation out of data/taco_yolo's resized images."""
    import json
    yolo = ROOT / "data/taco_yolo/images"
    assert yolo.exists(), "run prepare_taco.py first"
    split_of = {p.stem: p.parent.name for p in yolo.glob("*/*.jpg")}
    per_cat = defaultdict(list)
    for f in ["annotations.json", "annotations_unofficial.json"]:
        d = json.loads((RAW / "taco" / f).read_text(encoding="utf-8"))
        names = {c["id"]: c["name"] for c in d["categories"]}
        imgs = {im["id"]: im for im in d["images"]}
        for a in d["annotations"]:
            im = imgs[a["image_id"]]
            stem = im["file_name"].rsplit(".", 1)[0].replace("/", "_")
            cat = names[a["category_id"]]
            if cat in TACO_MAP and stem in split_of:
                per_cat[cat].append((stem, im["width"], a["id"], a["bbox"]))
    rng = __import__("random").Random(0)
    n = Counter()
    for cat, anns in per_cat.items():
        if cat in TACO_CAPS and len(anns) > TACO_CAPS[cat]:
            anns = rng.sample(anns, TACO_CAPS[cat])
        for stem, W, aid, (x, y, w, h) in anns:
            split = split_of[stem]
            with Image.open(yolo / split / f"{stem}.jpg") as img:
                s = img.width / W
                # a few TACO boxes spill past the image edge: clip before size check
                x0, y0 = max(0, x * s), max(0, y * s)
                x1, y1 = min(img.width, (x + w) * s), min(img.height, (y + h) * s)
                w, h = x1 - x0, y1 - y0
                if min(w, h) < TACO_MIN_SIDE:
                    continue
                px, py = w * TACO_PAD, h * TACO_PAD
                crop = img.crop((max(0, x0 - px), max(0, y0 - py),
                                 min(img.width, x1 + px), min(img.height, y1 + py)))
                out = dest / split / TACO_MAP[cat]
                out.mkdir(parents=True, exist_ok=True)
                crop.convert("RGB").save(out / f"{stem}_{aid}.jpg", "JPEG", quality=92)
                n[split] += 1
    print(f"taco crops: {dict(n)}")


def fetch(key, src):
    if "kaggle" in src:
        return Path(kagglehub.dataset_download(src["kaggle"])) / src["subdir"]
    if src.get("crops"):
        dest = RAW / "taco_crops"
        if not dest.exists():
            tmp = dest.with_name(dest.name + ".partial")
            shutil.rmtree(tmp, ignore_errors=True)
            build_taco_crops(tmp)
            tmp.rename(dest)  # only a finished build is reused next time
        return dest
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
            assert files or src.get("crops"), f"no images in {base / folder}"
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
