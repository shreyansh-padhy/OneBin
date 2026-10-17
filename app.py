"""Webcam / upload demo.  Run: python app.py  then open the printed URL."""
from pathlib import Path

import gradio as gr
import torch

from bins import BIN_DISPLAY, BINS, WARN
from train import bin_matrix, build_model, make_transforms

CKPT = Path(__file__).parent / "checkpoints/best.pt"
LOW_CONFIDENCE = 0.6

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
ckpt = torch.load(CKPT, map_location=device)
classes = ckpt["classes"]
_, eval_tf = make_transforms(ckpt["size"])
model = build_model(len(classes))
model.load_state_dict(ckpt["model"])
model.eval().to(device)
M = bin_matrix(classes)


@torch.no_grad()
def classify(img):
    if img is None:
        return "", {}
    probs = model(eval_tf(img.convert("RGB")).unsqueeze(0).to(device)).softmax(1)[0].cpu()
    bin_probs = probs @ M
    best = BINS[bin_probs.argmax()]
    conf = bin_probs.max().item()
    top_item = classes[probs.argmax()]

    verdict = f"## {BIN_DISPLAY[best]}\n**Looks like:** {top_item}  ·  **confidence:** {conf:.0%}"
    if top_item in WARN:
        verdict += f"\n\n{WARN[top_item]}"
    if conf < LOW_CONFIDENCE:
        verdict += "\n\n⚠️ Not sure — try another angle, or when in doubt, trash."
    return verdict, {b: float(p) for b, p in zip(BINS, bin_probs)}


with gr.Blocks(title="One Bin") as demo:
    gr.Markdown("# One Bin — compost, recycling, or trash?")
    with gr.Row():
        inp = gr.Image(type="pil", sources=["webcam", "upload"], label="Item")
        with gr.Column():
            verdict = gr.Markdown()
            detail = gr.Label(num_top_classes=3, label="Bin")
    inp.change(classify, inp, [verdict, detail])

if __name__ == "__main__":
    demo.launch()
