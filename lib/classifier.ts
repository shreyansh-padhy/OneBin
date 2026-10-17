// In-browser waste classifier: runs public/models/onebin.onnx with onnxruntime-web (WASM).
// The model and onebin.json are produced by export_onnx.py from checkpoints/best.pt and bins.py,
// so the bin rules here always match the Python side.
import type * as Ort from "onnxruntime-web";

export type ModelMeta = {
  source: string;
  classes: string[];
  size: number;
  mean: number[];
  std: number[];
  bins: string[];
  binOf: Record<string, string>;
  binDisplay: Record<string, string>;
  warn: Record<string, string>;
  lowConfidence: number;
};

export type Verdict = {
  bin: string;
  confidence: number; // probability of the chosen bin, summed over its fine classes
  item: string; // most likely fine class
  binProbs: { bin: string; p: number }[];
  topItems: { item: string; p: number }[];
  warnings: string[];
  lowConfidence: boolean;
  ms: number;
};

const MODEL_URL = "/models/onebin.onnx";
const META_URL = "/models/onebin.json";

export class Classifier {
  constructor(
    private ort: typeof Ort,
    private session: Ort.InferenceSession,
    readonly meta: ModelMeta,
  ) {}

  /** Classify a whole image (camera frame, uploaded photo, ...). */
  async classify(source: CanvasImageSource, width: number, height: number): Promise<Verdict> {
    const t0 = performance.now();
    const input = this.preprocess(source, width, height);
    const out = await this.session.run({ image: input });
    const probs = Array.from(out.probs.data as Float32Array);
    input.dispose();
    return this.verdict(probs, performance.now() - t0);
  }

  // Same as train.py's eval transform: resize shorter side to `size`, center crop, normalize.
  private preprocess(source: CanvasImageSource, width: number, height: number): Ort.Tensor {
    const { size, mean, std } = this.meta;
    const side = Math.min(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, size, size);
    const rgba = ctx.getImageData(0, 0, size, size).data;
    const plane = size * size;
    const chw = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
      for (let c = 0; c < 3; c++) chw[c * plane + i] = (rgba[4 * i + c] / 255 - mean[c]) / std[c];
    }
    return new this.ort.Tensor("float32", chw, [1, 3, size, size]);
  }

  private verdict(probs: number[], ms: number): Verdict {
    const { classes, bins, binOf, warn, lowConfidence } = this.meta;
    const binProbs = bins.map((bin) => ({
      bin,
      p: classes.reduce((sum, c, i) => (binOf[c] === bin ? sum + probs[i] : sum), 0),
    }));
    const best = binProbs.reduce((a, b) => (b.p > a.p ? b : a));
    const topItems = classes
      .map((item, i) => ({ item, p: probs[i] }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 3);
    const item = topItems[0].item;
    return {
      bin: best.bin,
      confidence: best.p,
      item,
      binProbs,
      topItems,
      warnings: warn[item] ? [warn[item]] : [],
      lowConfidence: best.p < lowConfidence,
      ms,
    };
  }
}

let loading: Promise<Classifier> | null = null;

/** Download the model once and reuse it; onProgress gets 0..1 (or null if the size is unknown). */
export function loadClassifier(onProgress?: (fraction: number | null) => void): Promise<Classifier> {
  loading ??= load(onProgress).catch((err) => {
    loading = null; // allow a retry
    throw err;
  });
  return loading;
}

async function load(onProgress?: (fraction: number | null) => void): Promise<Classifier> {
  const ort = (await import("onnxruntime-web/wasm")) as typeof Ort;
  ort.env.wasm.wasmPaths = "/ort/"; // copied from node_modules by scripts/copy-ort-wasm.mjs
  // Threads need cross-origin isolation (COOP/COEP headers in next.config.mjs).
  ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;

  const [meta, model] = await Promise.all([
    fetch(META_URL).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${META_URL} (HTTP ${r.status})`);
      return r.json() as Promise<ModelMeta>;
    }),
    fetchWithProgress(MODEL_URL, onProgress),
  ]);
  const session = await ort.InferenceSession.create(model, { executionProviders: ["wasm"] });
  return new Classifier(ort, session, meta);
}

async function fetchWithProgress(url: string, onProgress?: (fraction: number | null) => void) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Could not load ${url} (HTTP ${res.status})`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress?.(total ? received / total : null);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
