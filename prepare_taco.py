"""Download TACO (http://tacodataset.org) and convert it to a 1-class YOLO dataset.

Every litter annotation becomes class 0 "item": the detector only finds objects,
the classifier (train.py) decides which bin each one goes in. TACO's 60 categories
are too sparse to learn reliably, and the classifier is much better at that part.

    python prepare_taco.py                  # official + unofficial annotations
    python prepare_taco.py --no-unofficial  # official (reviewed) only

Val/test are official images only; unreviewed unofficial images go to train.
Output: data/taco_yolo/{images,labels}/{train,val,test}/ and data/taco_yolo/taco.yaml
"""
import argparse
import io
import json
import random
import time
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).parent
RAW = ROOT / "data/raw/taco"
ANN_URL = "https://raw.githubusercontent.com/pedropro/TACO/master/data/{}"


def load_annotations(name):
    path = RAW / name
    if not path.exists():
        RAW.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(ANN_URL.format(name), path)
    d = json.loads(path.read_text(encoding="utf-8"))
    boxes = defaultdict(list)
    for a in d["annotations"]:
        boxes[a["image_id"]].append(a["bbox"])
    return [(im, boxes[im["id"]]) for im in d["images"]]


def fetch(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return r.read()
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(2 ** i)


def process(job):
    """Download one image, resize it, write image + YOLO label. Returns a status string."""
    im, boxes, img_out, lbl_out, max_side = job
    if img_out.exists() and lbl_out.exists():
        return "cached"
    # The 1024px Flickr rendition shares the 640px URL's secret; fall back to the original.
    urls = []
    if im.get("flickr_640_url"):
        urls.append(im["flickr_640_url"].replace("_z.jpg", "_b.jpg"))
    urls.append(im["flickr_url"])
    for url in urls:
        try:
            img = ImageOps.exif_transpose(Image.open(io.BytesIO(fetch(url))))
            break
        except Exception:
            img = None
    if img is None:
        return "download failed"
    W, H = im["width"], im["height"]
    if abs(img.width / img.height - W / H) > 0.02:
        return "orientation mismatch"  # annotations wouldn't line up
    img = img.convert("RGB")
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    img.save(img_out, "JPEG", quality=92)

    lines = []
    for x, y, w, h in boxes:
        x0, y0 = max(x, 0), max(y, 0)
        x1, y1 = min(x + w, W), min(y + h, H)
        if x1 - x0 < 2 or y1 - y0 < 2:
            continue
        lines.append(f"0 {(x0 + x1) / 2 / W:.6f} {(y0 + y1) / 2 / H:.6f} {(x1 - x0) / W:.6f} {(y1 - y0) / H:.6f}")
    lbl_out.write_text("\n".join(lines))
    return "ok"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=ROOT / "data/taco_yolo")
    ap.add_argument("--no-unofficial", action="store_true")
    ap.add_argument("--max-side", type=int, default=1024)
    ap.add_argument("--workers", type=int, default=16)
    args = ap.parse_args()

    official = load_annotations("annotations.json")
    rng = random.Random(0)
    rng.shuffle(official)
    n = len(official)
    splits = {"val": official[:n // 10], "test": official[n // 10:n // 5], "train": official[n // 5:]}
    if not args.no_unofficial:
        splits["train"] = splits["train"] + load_annotations("annotations_unofficial.json")

    jobs = []
    for split, items in splits.items():
        (args.out / "images" / split).mkdir(parents=True, exist_ok=True)
        (args.out / "labels" / split).mkdir(parents=True, exist_ok=True)
        for im, boxes in items:
            stem = im["file_name"].rsplit(".", 1)[0].replace("/", "_")
            jobs.append((im, boxes, args.out / "images" / split / f"{stem}.jpg",
                         args.out / "labels" / split / f"{stem}.txt", args.max_side))

    status = defaultdict(int)
    with ThreadPoolExecutor(args.workers) as pool:
        for i, s in enumerate(pool.map(process, jobs), 1):
            status[s] += 1
            if i % 250 == 0 or i == len(jobs):
                print(f"{i}/{len(jobs)}  " + "  ".join(f"{k} {v}" for k, v in sorted(status.items())), flush=True)

    for split in splits:
        imgs = list((args.out / "images" / split).glob("*.jpg"))
        nbox = sum(len(p.read_text().split("\n")) for p in (args.out / "labels" / split).glob("*.txt") if p.read_text())
        print(f"{split:5s}: {len(imgs)} images, {nbox} boxes")

    (args.out / "taco.yaml").write_text(
        f"path: {args.out.resolve().as_posix()}\ntrain: images/train\nval: images/val\ntest: images/test\n"
        "names:\n  0: item\n")
    print(f"wrote {args.out / 'taco.yaml'}")


if __name__ == "__main__":
    main()
