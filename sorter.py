"""Two-stage multi-item sorter: YOLO finds items, the classifier picks each one's bin.

    from sorter import Sorter
    items = Sorter().sort(pil_image)   # [{"box": (x0,y0,x1,y1), "bin": ..., ...}, ...]

    python sorter.py photo.jpg         # prints items, writes photo_sorted.jpg
"""
import sys
from pathlib import Path

import torch
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO

from bins import BIN_DISPLAY, BINS
from train import bin_matrix, build_model, make_transforms

ROOT = Path(__file__).parent
BIN_COLOR = {"compost": (46, 160, 67), "recycling": (31, 111, 235), "trash": (80, 80, 80)}


class Sorter:
    def __init__(self, detector=ROOT / "checkpoints/detector.pt", classifier=ROOT / "checkpoints/best.pt",
                 det_conf=0.35, pad=0.1):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Without a trained detector, every photo is treated as one item.
        self.detector = YOLO(str(detector)) if Path(detector).exists() else None
        if self.detector is None:
            print(f"no detector at {detector} -- run train_detector.py; using single-item mode")
        ckpt = torch.load(classifier, map_location=self.device)
        self.classes = ckpt["classes"]
        self.tf = make_transforms(ckpt["size"])[1]
        self.model = build_model(len(self.classes))
        self.model.load_state_dict(ckpt["model"])
        self.model.eval().to(self.device)
        self.M = bin_matrix(self.classes).to(self.device)
        self.det_conf, self.pad = det_conf, pad

    @torch.no_grad()
    def classify(self, crops):
        x = torch.stack([self.tf(c.convert("RGB")) for c in crops]).to(self.device)
        probs = self.model(x).softmax(1)
        return probs, probs @ self.M

    def sort(self, img):
        """Returns one dict per detected item. With no detections, classifies the whole
        image as a single item (box=None) -- e.g. one item held close to the camera."""
        img = img.convert("RGB")
        boxes, det_confs = [], []
        if self.detector is not None:
            det = self.detector.predict(img, conf=self.det_conf, verbose=False)[0]
            boxes = [tuple(b) for b in det.boxes.xyxy.tolist()]
            det_confs = det.boxes.conf.tolist()
        crops = []
        for x0, y0, x1, y1 in boxes:
            px, py = (x1 - x0) * self.pad, (y1 - y0) * self.pad  # context helps the classifier
            crops.append(img.crop((max(0, x0 - px), max(0, y0 - py),
                                   min(img.width, x1 + px), min(img.height, y1 + py))))
        if not crops:
            crops, boxes, det_confs = [img], [None], [None]
        probs, bin_probs = self.classify(crops)
        items = []
        for box, dc, p, bp in zip(boxes, det_confs, probs, bin_probs):
            items.append(dict(box=box, det_conf=dc, bin=BINS[bp.argmax()], bin_conf=bp.max().item(),
                              item=self.classes[p.argmax()], bin_probs=dict(zip(BINS, bp.tolist()))))
        return items


def draw(img, items):
    img = img.convert("RGB").copy()
    d = ImageDraw.Draw(img)
    w = max(2, img.width // 250)
    try:
        font = ImageFont.truetype("arial.ttf", max(14, img.width // 45))
    except OSError:
        font = ImageFont.load_default()
    for it in items:
        if it["box"] is None:
            continue
        color = BIN_COLOR[it["bin"]]
        d.rectangle(it["box"], outline=color, width=w)
        label = f"{it['bin']} {it['bin_conf']:.0%}"
        x0, y0 = it["box"][:2]
        tb = d.textbbox((x0, y0), label, font=font)
        y = y0 - (tb[3] - tb[1]) - 2 * w if y0 > tb[3] - tb[1] + 2 * w else y0
        tb = d.textbbox((x0 + w, y + w), label, font=font)
        d.rectangle((tb[0] - w, tb[1] - w, tb[2] + w, tb[3] + w), fill=color)
        d.text((x0 + w, y + w), label, fill="white", font=font)
    return img


if __name__ == "__main__":
    s = Sorter()
    for path in sys.argv[1:]:
        img = Image.open(path)
        items = s.sort(img)
        for it in items:
            print(f"{path}: {BIN_DISPLAY[it['bin']]:16s} {it['bin_conf']:.0%}  looks like {it['item']}  box {it['box']}")
        out = Path(path).with_name(Path(path).stem + "_sorted.jpg")
        draw(img, items).save(out)
        print(f"wrote {out}")
