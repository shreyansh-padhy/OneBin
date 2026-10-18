"""Export TACO YOLO item detector checkpoint to ONNX for in-browser execution.
checkpoints/detector.pt -> public/models/detector.onnx
"""
from pathlib import Path
import shutil
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent
ckpt = ROOT / "checkpoints" / "detector.pt"
out_dir = ROOT / "public" / "models"
out_dir.mkdir(parents=True, exist_ok=True)

print(f"Loading detector from {ckpt}...")
model = YOLO(str(ckpt))

print("Exporting detector to ONNX (imgsz=640)...")
exported_path = model.export(format="onnx", imgsz=640, dynamic=False, simplify=False)
print(f"Exported to {exported_path}")

target_path = out_dir / "detector.onnx"
shutil.copyfile(exported_path, target_path)
print(f"Successfully copied to {target_path} (size: {target_path.stat().st_size / (1024*1024):.2f} MB)")
