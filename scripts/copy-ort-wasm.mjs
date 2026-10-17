// Copies the onnxruntime-web WASM runtime into public/ort/ so the app serves it itself
// (same origin, so it works under the COOP/COEP headers that enable multithreading).
// Runs automatically before `npm run dev` and `npm run build`.
import { copyFileSync, mkdirSync } from "node:fs";

const src = "node_modules/onnxruntime-web/dist/";
const dst = "public/ort/";
mkdirSync(dst, { recursive: true });
for (const file of ["ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.mjs"]) {
  copyFileSync(src + file, dst + file);
}
console.log(`copied onnxruntime-web runtime to ${dst}`);
