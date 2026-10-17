# OneBin 🗑️♻️🌱

> **Instant, zero-latency waste sorting powered by in-browser ONNX WebAssembly, paired with deep multimodal reasoning via Google Gemini 2.5 Flash.**

Live Production: [https://onebin.vercel.app](https://onebin.vercel.app)

---

## Overview

**OneBin** solves the universal contamination problem in urban recycling and composting. Users simply point their device's camera or upload a photo of discarded waste, and OneBin immediately categorizes it into **🟢 Compost**, **🔵 Recycling**, or **⚫ Trash** according to **Seattle Public Utilities (SPU)** municipal regulations.

### Key Capabilities
- **⚡ Instant On-Device Inference (< 50ms)**: Runs entirely client-side using `onnxruntime-web` with WebAssembly (WASM), Web Workers, and SIMD acceleration. Works completely offline with zero latency and full user privacy.
- **✨ Deep Multimodal Reasoning (Gemini 2.5 Flash)**: On-demand serverless cloud analysis using Google's `@google/genai` SDK with strict JSON schema enforcement (`responseSchema`), explaining material composition and regulatory rationale.
- **🛡️ Seattle Municipal Waste Compliance**:
  - **Plastic Bags & Films**: Strictly routed to **Trash** (they tangle mechanical sorting facility star screens).
  - **Styrofoam / Expanded Polystyrene**: Strictly routed to **Trash** (not curbside recyclable).
  - **Batteries & Hazards**: Routed to **Trash** with high-visibility safety warnings directing to hazardous waste drop-off locations.
  - **Uncertain / Ambiguous Items**: Automated low-confidence flag: *"When in doubt, trash."*

---

## Hybrid Architecture

OneBin pairs edge machine learning with cloud multimodal intelligence:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
├──────────────────────────────┬──────────────────────────────┤
│    Local Edge Inference      │   On-Demand Cloud Vision     │
│   (onnxruntime-web / WASM)   │      (Gemini 2.5 Flash)      │
│                              │                              │
│   • Model: onebin.onnx       │   • POST /api/classify       │
│   • Speed: ~20-50ms          │   • Structured JSON Schema   │
│   • Offline: Yes             │   • Material decomposition   │
│   • Privacy: 100% on-device  │   • Contamination warnings   │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │                              │
               ▼                              ▼
      [ Instant Verdict ]             [ Deep AI Rationale ]
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
- **Cloud Vision**: Google Gen AI SDK (`@google/genai`), Gemini 2.5 Flash (`gemini-2.5-flash`)
- **Deployment**: Vercel Serverless Edge, GitHub Actions automated CI/CD pipeline
- **Model Training & Export**: PyTorch, torchvision, ONNX (`export_onnx.py`)

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 20 / 22)
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

3. Configure Environment Variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Provide your Gemini API key from [Google AI Studio](https://aistudio.google.com/):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts & Commands

- `npm run dev`: Launch Next.js local development server (with ONNX WASM pre-copy).
- `npm run build`: Production build with static optimization and dynamic API route compilation.
- `npm run lint`: Run ESLint checks.
- `npm run start`: Start production server.
- `python export_onnx.py`: Export PyTorch model (`checkpoints/best.pt`) to ONNX (`public/models/onebin.onnx`) and generate metadata (`public/models/onebin.json`).

---

## Deployment

OneBin is continuously deployed to **Vercel** via GitHub Actions:
- Every push to `main` executes linting, type validation, and production build checks.
- On successful validation, GitHub Actions deploys the build directly to Vercel production:
  - **Live URL**: [https://onebin.vercel.app](https://onebin.vercel.app)

---

## Team & Attribution
- Project by University of Washington CSE students.
- Special thanks to Seattle Public Utilities for open waste diversion guidelines.
