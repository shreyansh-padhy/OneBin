# CLAUDE.md

This file gives Claude Code (claude.ai/code) guidance for working in this repository.

## Project

**One Bin** is an image classifier that tells you whether an item goes in **compost, recycling, or trash**. It fine-tunes EfficientNetV2-S on the 10-class Garbage Classification v2 dataset. A Gradio app serves predictions from a webcam or an uploaded photo.

## Commands

```bash
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

- [bins.py](bins.py) is the single source of truth for bins:
  - `BIN_OF` maps each class name to a bin.
  - `BINS` is the ordered bin list (`compost`, `recycling`, `trash`).
  - `BIN_DISPLAY` gives each bin its UI label.
  - `WARN` holds extra warnings shown for a predicted class regardless of bin (e.g. battery).

  Edit this file to match local disposal rules; changing it needs **no retraining**. Every dataset class must be a key in `BIN_OF`, and every bin it maps to must be in `BINS`.
- [train.py](train.py) also serves as the shared library that `app.py` imports:
  - `make_transforms(size)` returns `(train_tf, eval_tf)`.
  - `build_model(n, pretrained)` creates EfficientNetV2-S with an n-way classification head.
  - `bin_matrix(classes)` builds the 0/1 `(num_classes, len(BINS))` matrix, so `probs @ M` gives bin probabilities.
  - `split_indices` makes a stratified 80/10/10 split with a fixed seed (0), so the test set never changes between runs. Keep it deterministic.
  - Classes are balanced with a `WeightedRandomSampler`, because biological is the *only* compost class.
  - `--extra` images are remapped onto the base dataset's class indices by folder name. They are added to training only and never to val or test.
  - Checkpoint selection uses **validation 3-bin accuracy**, not 10-class accuracy.
  - The checkpoint format is `{"model": state_dict, "classes": [...], "size": int}`.
  - Uses AdamW, OneCycleLR, label smoothing 0.1, and AMP when CUDA is available.
- [app.py](app.py): loads the checkpoint at import time. It rebuilds `eval_tf` with the checkpoint's `size` and the model with `build_model`. It computes bin probabilities with `bin_matrix`, then appends `WARN` text and, below `LOW_CONFIDENCE` (0.6), a "when in doubt, trash" note.

## Conventions and gotchas

- Train and inference must share preprocessing and model construction. Always go through `make_transforms`, `build_model` and `bin_matrix` instead of duplicating them, and take the image size from the checkpoint rather than hardcoding it.
- The class order comes from `ImageFolder` (alphabetical folder names) and is stored in the checkpoint. Don't hardcode class indices.
- Importing `train.py` must stay cheap: training only runs under `main()`, so keep heavy work out of module scope there.
- `checkpoints/`, `train.log`, `__pycache__/` and the dataset are generated artifacts. Don't commit them.
