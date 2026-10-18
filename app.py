"""Webcam / upload demo.  Run: python app.py  then open the printed URL."""
from collections import Counter

import gradio as gr

from bins import BIN_DISPLAY, WARN
from sorter import Sorter, draw

LOW_CONFIDENCE = 0.6
sorter = Sorter()


def classify(img):
    if img is None:
        return None, ""
    items = sorter.sort(img)
    counts = Counter(it["bin"] for it in items)
    lines = ["## " + "  ·  ".join(f"{BIN_DISPLAY[b]} × {n}" for b, n in counts.most_common())]
    for i, it in enumerate(sorted(items, key=lambda it: it["box"][0] if it["box"] else 0), 1):
        line = f"{i}. {BIN_DISPLAY[it['bin']]} — looks like **{it['item']}** ({it['bin_conf']:.0%})"
        if it["item"] in WARN:
            line += f"  \n   {WARN[it['item']]}"
        if it["bin_conf"] < LOW_CONFIDENCE:
            line += "  \n   ⚠️ Not sure — try another angle, or when in doubt, trash."
        lines.append(line)
    if items[0]["box"] is None:
        lines.append("\n_No separate items found — classified the whole photo as one item._")
    return draw(img, items), "\n".join(lines)


with gr.Blocks(title="One Bin") as demo:
    gr.Markdown("# One Bin — compost, recycling, or trash?")
    with gr.Row():
        inp = gr.Image(type="pil", sources=["webcam", "upload"], label="Items")
        with gr.Column():
            out_img = gr.Image(label="Sorted", interactive=False)
            verdict = gr.Markdown()
    inp.change(classify, inp, [out_img, verdict])

if __name__ == "__main__":
    demo.launch()
