"""Export the classifier for the in-browser web app (onnxruntime-web).

    python export_onnx.py                          # checkpoints/best.pt -> public/models/
    python export_onnx.py --ckpt checkpoints/x.pt --check 500

Writes:
  public/models/onebin.onnx   fp16 weights, fp32 input/output: image -> 12-class softmax
  public/models/onebin.json   classes, input size, normalization, and the bin rules from bins.py

Then checks the ONNX model against PyTorch on held-out test images (3-bin accuracy and
max probability difference), so a bad export never ships silently.
Needs: pip install onnx onnxruntime onnxscript onnxconverter-common
"""
import argparse
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import numpy as np
import onnx
import onnxruntime as ort
import torch
import torch.nn as nn
from onnxconverter_common import float16
from torch.utils.data import DataLoader, Subset
from torchvision import datasets

from bins import BIN_DISPLAY, BIN_OF, BINS, WARN
from train import DEFAULT_DATA, MEAN, STD, bin_matrix, build_model, make_transforms, split_indices

ROOT = Path(__file__).parent
LOW_CONFIDENCE = 0.6  # keep in sync with app.py


class WithSoftmax(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, x):
        return self.model(x).softmax(1)


def check(onnx_path, model, classes, size, data, n):
    """Compare ONNX vs PyTorch on n test images (same split as train.py)."""
    ds = datasets.ImageFolder(data, transform=make_transforms(size)[1])
    assert ds.classes == classes, f"dataset classes {ds.classes} != checkpoint classes {classes}"
    te = split_indices(ds.targets)[2]
    te = te[:: max(1, len(te) // n)][:n]
    sess = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    M = bin_matrix(classes)
    fine_to_bin = M.argmax(1)
    ok_pt = ok_ox = agree = total = 0
    max_diff = 0.0
    for x, y in DataLoader(Subset(ds, te), batch_size=16):
        with torch.no_grad():
            p_pt = model(x)
        p_ox = torch.from_numpy(sess.run(None, {"image": x.numpy()})[0])
        max_diff = max(max_diff, (p_pt - p_ox).abs().max().item())
        b_pt, b_ox, b_true = (p_pt @ M).argmax(1), (p_ox @ M).argmax(1), fine_to_bin[y]
        ok_pt += (b_pt == b_true).sum().item()
        ok_ox += (b_ox == b_true).sum().item()
        agree += (b_pt == b_ox).sum().item()
        total += len(y)
    print(f"check on {total} test images: 3-bin acc pytorch {ok_pt / total:.3f}  onnx {ok_ox / total:.3f}  "
          f"bin agreement {agree / total:.3f}  max prob diff {max_diff:.4f}")
    return agree / total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", type=Path, default=ROOT / "checkpoints/best.pt")
    ap.add_argument("--out", type=Path, default=ROOT / "public/models")
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA)
    ap.add_argument("--check", type=int, default=300, help="test images to verify on (0 = skip)")
    args = ap.parse_args()

    ckpt = torch.load(args.ckpt, map_location="cpu")
    classes, size = ckpt["classes"], ckpt["size"]
    missing = [c for c in classes if c not in BIN_OF]
    assert not missing, f"bins.py has no bin for {missing}"
    model = build_model(len(classes))
    model.load_state_dict(ckpt["model"])
    model = WithSoftmax(model).eval()

    args.out.mkdir(parents=True, exist_ok=True)
    fp32_path, onnx_path = args.out / "onebin.fp32.onnx", args.out / "onebin.onnx"
    torch.onnx.export(
        model, (torch.zeros(1, 3, size, size),), fp32_path, dynamo=True,
        input_names=["image"], output_names=["probs"],
        dynamic_shapes={"x": {0: torch.export.Dim("batch", max=64)}},
    )
    fp16 = float16.convert_float_to_float16(onnx.load(fp32_path), keep_io_types=True)
    onnx.save(fp16, onnx_path)
    for p in (fp32_path, fp32_path.with_name(fp32_path.name + ".data")):  # exporter may split weights out
        p.unlink(missing_ok=True)

    meta = {
        "source": args.ckpt.name,
        "classes": classes,
        "size": size,
        "mean": MEAN,
        "std": STD,
        "bins": BINS,
        "binOf": {c: BIN_OF[c] for c in classes},
        "binDisplay": BIN_DISPLAY,
        "warn": WARN,
        "lowConfidence": LOW_CONFIDENCE,
    }
    (args.out / "onebin.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {onnx_path} ({onnx_path.stat().st_size / 1e6:.1f} MB) and onebin.json")

    if args.check:
        agreement = check(onnx_path, model, classes, size, args.data, args.check)
        assert agreement >= 0.99, "ONNX model disagrees with PyTorch -- do not ship it"


if __name__ == "__main__":
    main()
