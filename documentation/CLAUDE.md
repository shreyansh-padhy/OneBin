# CLAUDE.md

This file gives Claude Code (claude.ai/code) guidance for working in this repository.

## Project

**One Bin** is an image classifier that tells you whether an item goes in **compost, recycling, or trash**. It fine-tunes EfficientNetV2-S on the 10-class Garbage Classification v2 dataset. A Gradio app serves predictions from a webcam or an uploaded photo. The public website (Next.js on Vercel, https://onebin.vercel.app) runs the same model **in the browser** with onnxruntime-web.

## Commands

```bash
# Web app (Node 20+). predev/prebuild copy the onnxruntime-web WASM runtime into public/ort/
npm install && npm run dev        # or: npm run lint && npm run build

# After retraining: re-export the browser model (public/models/onebin.onnx + onebin.json).
# Verifies ONNX vs PyTorch on test images and refuses to finish if they disagree.
# Needs: pip install onnx onnxruntime onnxscript onnxconverter-common
python export_onnx.py

# Train (writes checkpoints/best.pt, prints test accuracy and a 3x3 bin confusion matrix)
python train.py

# Fine-tune further on your own photos (folders named after the 10 classes)
python train.py --extra real --init checkpoints/best.pt --epochs 4 --lr 1e-4

# Launch the webcam/upload demo (needs checkpoints/best.pt)
python app.py
```

`train.py` flags: `--data`, `--extra`, `--init`, `--epochs` (10), `--lr` (1e-3), `--batch` (32), `--size` (320), `--workers` (6), `--out` (`checkpoints/best.pt`).

Requirements: Python 3.12+ (`print_confusion` puts a backslash inside an f-string expression), `torch`, `torchvision`, `gradio`. The default dataset path is the kagglehub cache: `~/.cache/kagglehub/datasets/sumn2u/garbage-classification-v2/versions/12/standardized_384`. Download it with `kagglehub.dataset_download("sumn2u/garbage-classification-v2")`, or pass `--data`.

There is no test suite. `train.py` reports accuracy on a held-out test split when it finishes.

## Architecture

The model predicts **10 fine-grained classes**. Bins are a separate mapping layered on top: fine-class softmax probabilities are summed into bin probabilities. This separation is the core design idea.

- [bins.py](../bins.py) is the single source of truth for bins:
  - `BIN_OF` maps each class name to a bin.
  - `BINS` is the ordered bin list (`compost`, `recycling`, `trash`).
  - `BIN_DISPLAY` gives each bin its UI label.
  - `WARN` holds extra warnings shown for a predicted class regardless of bin (e.g. battery).

  Edit this file to match local disposal rules; changing it needs **no retraining**. Every dataset class must be a key in `BIN_OF`, and every bin it maps to must be in `BINS`.
- [train.py](../train.py) also serves as the shared library that `app.py` imports:
  - `make_transforms(size)` returns `(train_tf, eval_tf)`.
  - `build_model(n, pretrained)` creates EfficientNetV2-S with an n-way classification head.
  - `bin_matrix(classes)` builds the 0/1 `(num_classes, len(BINS))` matrix, so `probs @ M` gives bin probabilities.
  - `split_indices` makes a stratified 80/10/10 split with a fixed seed (0), so the test set never changes between runs. Keep it deterministic. Exception: sources in `FIXED_SPLIT_SOURCES` (TACO crops, named `taco__<split>_…`) keep the split of the photo they were cut from, so the detector's test photos stay unseen by the classifier too. Pass `paths=` to get this.
  - Classes are balanced with a `WeightedRandomSampler`, because biological is the *only* compost class.
  - `--extra` images are remapped onto the base dataset's class indices by folder name. They are added to training only and never to val or test.
  - Checkpoint selection uses **validation 3-bin accuracy**, not 10-class accuracy.
  - The checkpoint format is `{"model": state_dict, "classes": [...], "size": int}`.
  - Uses AdamW, OneCycleLR, label smoothing 0.1, and AMP when CUDA is available.
- [app.py](../app.py): loads the checkpoint at import time. It rebuilds `eval_tf` with the checkpoint's `size` and the model with `build_model`. It computes bin probabilities with `bin_matrix`, then appends `WARN` text and, below `LOW_CONFIDENCE` (0.6), a "when in doubt, trash" note.

### Web app (in-browser inference)

- [export_onnx.py](../export_onnx.py) writes `public/models/onebin.onnx` (fp16 weights, fp32 input and output; it outputs softmax probabilities) and `public/models/onebin.json`. The JSON holds the class list, input size, normalization and the bin rules copied from `bins.py`. The web app never hardcodes classes or bins: **after changing `bins.py` or retraining, rerun `export_onnx.py`** and commit both files.
- [lib/sorter.ts](../lib/sorter.ts) and [lib/classifier.ts](../lib/classifier.ts): Loads `public/models/detector.onnx` and `public/models/onebin.onnx`. It performs client-side edge bounding box detection and classification with canvas overlays.
- UI: [components/Sorter.tsx](../components/Sorter.tsx) (state, upload and drag-drop), [BoundingBoxOverlay.tsx](../components/BoundingBoxOverlay.tsx), [CameraCapture.tsx](../components/CameraCapture.tsx), and [VerdictCard.tsx](../components/VerdictCard.tsx).
- **Physical Actuation**: [lib/serial.ts](../lib/serial.ts) provides `sendGatedBinCommand` which gates servo lid triggers by confidence ($\ge 60\%$) and debounces by 3.5s cooldown to prevent servo thrashing during continuous Auto-Scan.
- [next.config.mjs](../next.config.mjs) sends COOP/COEP headers so onnxruntime-web can use threads. Anything loaded from another origin (scripts, images, iframes) must send CORP/CORS headers, or the browser will block it.
- **Python vs. Web Scope**: The web app runs ONNX WASM models in-browser. The Python scripts (`sorter.py`, `app.py`) run native PyTorch / Ultralytics models (`checkpoints/detector.pt`, `checkpoints/best.pt`) for local facility batch sorting and Gradio demos. All Python dependencies are tracked in `requirements.txt`.

## Conventions and gotchas

- [REFERENCES.md](REFERENCES.md) lists every source we use (the dataset, papers and libraries). When you adopt a new dataset, model, method or library, add its citation there.

- Train and inference must share preprocessing and model construction. Always go through `make_transforms`, `build_model` and `bin_matrix` instead of duplicating them, and take the image size from the checkpoint rather than hardcoding it.
- The class order comes from `ImageFolder` (alphabetical folder names) and is stored in the checkpoint. Don't hardcode class indices.
- Importing `train.py` must stay cheap: training only runs under `main()`, so keep heavy work out of module scope there.
- `train.log`, `__pycache__/`, `runs/` and the dataset are generated artifacts. Don't commit them.
- Checkpoints that others need (`best.pt`, `detector.pt`, `best_taco.pt`) are committed through Git LFS (`.gitattributes`: `checkpoints/*.pt`). `checkpoints/` is still in `.gitignore`, so add them with `git add -f`; leave scratch checkpoints uncommitted.
