# OneBin 🗑️♻️🌱

> **Instant, zero-latency waste sorting powered entirely on-device by in-browser ONNX WebAssembly.**
> Zero API keys, zero cloud latency, zero compute costs, 100% private.

Live Production: [https://onebin.vercel.app](https://onebin.vercel.app)

---

## Overview

**OneBin** solves the universal contamination problem in urban recycling and composting. Users simply point their device's camera or upload a photo of discarded waste, and OneBin immediately categorizes it into **🟢 Compost**, **🔵 Recycling**, or **⚫ Trash** according to **Seattle Public Utilities (SPU)** municipal regulations.

### Key Capabilities
- **⚡ Instant On-Device Inference (< 50ms)**: Runs entirely client-side using `onnxruntime-web` with WebAssembly (WASM), Web Workers, and SIMD acceleration. Works completely offline with zero latency and full user privacy.
- **🔑 Zero API Keys Required**: No external cloud AI API keys (Google Gemini, OpenAI, Anthropic, etc.) required. All neural network weights execute within the client browser sandbox.
- **🛡️ Seattle Municipal Waste Compliance**:
  - **Plastic Bags & Films**: Strictly routed to **Trash** (they tangle mechanical sorting facility star screens).
  - **Styrofoam / Expanded Polystyrene**: Strictly routed to **Trash** (not curbside recyclable).
  - **Batteries & Hazards**: Routed to **Trash** with high-visibility safety warnings directing to hazardous waste drop-off locations.
  - **Uncertain / Ambiguous Items**: Automated low-confidence flag: *"When in doubt, trash."*

---

## Edge Architecture

OneBin executes 100% client-side in the browser:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
├─────────────────────────────────────────────────────────────┤
│    Local Edge Inference (onnxruntime-web / WASM)            │
│                                                             │
│   • Model: public/models/onebin.onnx (FP16, 41.7MB)         │
│   • Speed: ~20-50ms                                         │
│   • Offline: Yes                                            │
│   • Privacy: 100% on-device (camera frames never leave device)
│   • Zero Cloud Compute Costs                                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
                      [ Instant Verdict ]
```

### 12-Class Seattle Taxonomy (`bins.py`)
| Fine Class | Curbside Bin | Municipal Handling Rule |
|---|---|---|
| `biological` | 🟢 Compost | Food scraps, yard waste, BPI-certified packaging |
| `cardboard` | 🔵 Recycling | Flattened, clean, dry boxes |
| `glass` | 🔵 Recycling | Empty and rinsed glass bottles & jars |
| `metal` | 🔵 Recycling | Clean aluminum/tin cans and balled foil |
| `paper` | 🔵 Recycling | Clean paper, mail, newspapers |
| `plastic` | 🔵 Recycling | Clean rigid plastic bottles, jugs, tubs |
| `plastic_bag` | ⚫ Trash | Plastic bags/film tangle sorting machines |
| `styrofoam` | ⚫ Trash | Expanded polystyrene is not curbside recyclable |
| `clothes` | ⚫ Trash | Curbside trash (or direct donation) |
| `shoes` | ⚫ Trash | Curbside trash (or direct donation) |
| `battery` | ⚫ Trash | ⚠️ Hazardous drop-off warning attached |
| `trash` | ⚫ Trash | General non-recyclable solid waste |

---

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React
- **Edge ML**: `onnxruntime-web` (WASM + multi-threading via COOP/COEP headers)
- **Deployment**: Vercel Serverless Edge, GitHub Actions automated CI/CD pipeline
- **Model Training & Export**: PyTorch, torchvision, ONNX (`export_onnx.py`)

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 20 / 22 / 24)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shreyansh-padhy/OneBin.git
   cd OneBin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   *(The `predev` and `prebuild` lifecycle scripts automatically copy ONNX runtime WASM assets to `public/ort/`)*

3. Start the development server (No API keys or `.env` needed!):
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts & Commands

- `npm run dev`: Launch Next.js local development server (with ONNX WASM pre-copy).
- `npm run build`: Production build with static optimization.
- `npm run lint`: Run ESLint checks.
- `npm run start`: Start production server.
- `python export_onnx.py`: Export PyTorch model (`checkpoints/best.pt`) to ONNX (`public/models/onebin.onnx`) and generate metadata (`public/models/onebin.json`).

---

## Deployment & Hosting

OneBin is continuously deployed to **Vercel** via GitHub Actions:
- **No Docker containers required**: The ONNX model is served as an optimized static asset via Vercel's global CDN and executes inside the client's browser.
- Every push to `main` executes linting, type validation, and production build checks.
- On successful validation, GitHub Actions deploys the build directly to Vercel production:
  - **Live URL**: [https://onebin.vercel.app](https://onebin.vercel.app)

---

## Team & Attribution
- Project by University of Washington CSE students.
- Special thanks to Seattle Public Utilities for open waste diversion guidelines.
