"""Train the item detector (stage 1) on TACO.  Run prepare_taco.py first.

    python train_detector.py
    python train_detector.py --model yolo26m.pt --imgsz 960 --epochs 150
    python train_detector.py --resume      # after a crash / shutdown mid-training

Best weights are copied to checkpoints/detector.pt, which sorter.py / app.py load.
"""
import argparse
import shutil
from pathlib import Path

from ultralytics import YOLO

ROOT = Path(__file__).parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=ROOT / "data/taco_yolo/taco.yaml")
    ap.add_argument("--model", default="yolo26s.pt")
    ap.add_argument("--epochs", type=int, default=100)
    ap.add_argument("--imgsz", type=int, default=640)
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--cache", default="ram", help="ram | disk | none (ram: ~5 GB, much faster)")
    ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--name", default="taco")
    ap.add_argument("--out", type=Path, default=ROOT / "checkpoints/detector.pt")
    ap.add_argument("--resume", action="store_true", help="continue an interrupted run from its last.pt")
    args = ap.parse_args()

    if args.resume:
        # Restores epochs, optimizer and all settings from the interrupted run.
        YOLO(ROOT / "runs" / args.name / "weights/last.pt").train(resume=True)
    else:
        YOLO(args.model).train(
            data=str(args.data), epochs=args.epochs, imgsz=args.imgsz, batch=args.batch,
            patience=25, project=str(ROOT / "runs"), name=args.name, exist_ok=True,
            workers=args.workers, cache=False if args.cache == "none" else args.cache,
            cos_lr=True, close_mosaic=10,
            degrees=10, flipud=0.5,  # litter is photographed from above: any orientation
        )
    best = ROOT / "runs" / args.name / "weights/best.pt"
    metrics = YOLO(best).val(data=str(args.data), split="test", imgsz=args.imgsz,
                             project=str(ROOT / "runs"), name=f"{args.name}_test", exist_ok=True)
    print(f"\nTEST  mAP50 {metrics.box.map50:.3f}  mAP50-95 {metrics.box.map:.3f}  "
          f"precision {metrics.box.mp:.3f}  recall {metrics.box.mr:.3f}")
    args.out.parent.mkdir(exist_ok=True)
    shutil.copy(best, args.out)
    print(f"saved {args.out}")


if __name__ == "__main__":
    main()
