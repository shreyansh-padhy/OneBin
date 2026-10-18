# OneBin 🗑️♻️🌱

> **Automated waste classification and mechanical sorting intelligence for municipal recovery facilities.**
> Citizens use **one single bin** — computer vision separates compost, recycling, and trash at the facility.
> Zero API keys, zero cloud latency, zero compute costs, 100% silent optical sensing (zero microphones, zero sound).

Live Production: [https://onebin.vercel.app](https://onebin.vercel.app)  
Facility Stage Telemetry: [https://onebin.vercel.app/dashboard](https://onebin.vercel.app/dashboard)

---

## The OneBin Paradigm

Today's curbside recycling system places the entire cognitive burden on citizens to manually segregate waste into three bins (Trash, Compost, Recycling). This model fails universally:
- **Consumer Confusion & Fatigue**: Citizens struggle with ambiguous materials (coffee cups, greasy pizza boxes, plastic wrap, bio-plastics).
- **Catastrophic Contamination**: A single contaminated item can ruin an entire multi-ton recycling bale, costing cities millions in landfill fines and generating methane emissions.

### The Solution: One Unified Bin for Citizens, AI Separation at the Facility
With **OneBin**, everyday people and businesses dispose of all waste into **ONE SINGLE BIN** ("OneBin") without sorting anxiety. 

The entire mixed waste stream is collected and transported to **centralized municipal recovery facilities (MRFs) and sorting stations**. Downstream sorting lines deploy OneBin's computer vision and automated mechanical actuators (conveyor diverters, servos, pneumatic air sorters) to classify and split the stream into:
- **🟢 Compost** (Food waste, organics, yard debris)
- **🔵 Recycling** (Clean cardboard, paper, glass, metals, rigid plastics)
- **⚫ Trash** (Non-recyclable films, styrofoam, general landfill)

---

## Key Capabilities

- **🏭 Facility-Grade Computer Vision**: High-speed frame classification designed for conveyor belts, chute diverters, and facility sorting lines.
- **⚡ Instant On-Device Inference (< 50ms)**: Runs entirely client-side on facility terminals using `onnxruntime-web` with WebAssembly (WASM), Web Workers, and SIMD acceleration. Works completely offline with zero latency.
- **👁️ 100% Silent Optical Sensing (Zero Sound & Microphone Usage)**: All classification is strictly visual. No microphones, audio inputs, or voice synthesis are used.
- **🔑 Zero Cloud API Keys Required**: No external paid AI API keys (Google Gemini, OpenAI, etc.). All neural network weights execute within the local sandbox.
- **🤖 Physical IoT Actuation**: Integrated Web Serial API communicating with microcontroller hardware (`firmware/arduino_bins.ino`) to drive physical lid/conveyor servo diverters in real time.
- **📊 Realtime Facility Telemetry**: Live stage and facility dashboard (`/dashboard`) monitoring sorting throughput, landfill diversion rates, and contamination metrics over `BroadcastChannel` and Supabase Realtime.
- **🛡️ Seattle Municipal Waste Compliance**:
  - **Plastic Bags & Films**: Strictly routed to **Trash** (they tangle mechanical sorting star screens).
  - **Styrofoam / Expanded Polystyrene**: Strictly routed to **Trash** (not curbside recyclable).
  - **Batteries & Hazards**: Routed to **Trash** with high-visibility safety warnings directing to hazardous waste drop-off locations.
  - **Uncertain / Ambiguous Items**: Automated low-confidence flag: *"When in doubt, trash."*

---

## Edge Architecture

```
[Unified Waste Stream: One Single Bin for Consumers]
                         │
                         ▼ (Transported to Municipal Facility)
[High-Speed Visual Facility Camera (Zero Microphones)]
                         │
                         ▼ (Center-Crop 320x320 Optical Frame)
[onnxruntime-web (WebAssembly + SIMD Threads)]
   • Model: public/models/onebin.onnx (FP16, 41.7MB)
   • 12 Seattle fine-grained classes -> 3 streams
   • Speed: ~20ms - 50ms on facility terminal
   • Zero Cloud API Keys, Zero Cloud Compute Costs
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[Physical IoT Servo Actuator]     [Facility Stage Telemetry]
• Web Serial API (9600 baud)      • /dashboard
• Drives physical bin diverters   • Live diversion stats & logs
• Arduino firmware (Uno / ESP32)  • BroadcastChannel / Supabase
```

### 12-Class Seattle Taxonomy (`bins.py`)
| Fine Class | Curbside Stream | Municipal Handling Rule |
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
- **IoT & Hardware**: Web Serial API, Arduino C++ Servo Firmware (`firmware/arduino_bins.ino`)
- **Telemetry & Sync**: Supabase Realtime, native browser `BroadcastChannel`
- **Deployment**: Vercel Serverless Edge, GitHub Actions automated CI/CD pipeline
- **Model Training**: PyTorch, torchvision, ONNX (trained offline across 4 combined waste benchmarks; currently iterating through training checkpoints)

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

3. Start the development server (No API keys or `.env` required!):
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the facility sorting view, or [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the stage telemetry scoreboard.

---

## Hardware Integration (IoT Smart Sorter)
For automated physical sorting, connect an Arduino Uno / ESP32 running [`firmware/arduino_bins.ino`](firmware/arduino_bins.ino) via USB. Click **"Connect Smart Bin"** in the web interface to establish a 9600-baud Web Serial connection. The application automatically triggers servo diverters for each classified item.

---

## Automated 3-Way Integration & Health Check

Validate the end-to-end integration between GitHub, Vercel, and Supabase at any time:

```bash
npm run verify
```

This automated test suite verifies:
1. **GitHub $\rightarrow$ Vercel**: Production endpoint HTTP 200, WebAssembly cross-origin headers (`COOP: same-origin`, `COEP: require-corp`), and ONNX weight CDN cache.
2. **Vercel $\rightarrow$ Supabase Configuration**: Presence and JWT validity of `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Live Supabase Operations**: Row insertion, real-time readback via RLS, `get_bin_analytics()` RPC execution, and `waste-dataset` storage bucket upload/readback.

---

## Active Learning Training Pipeline

OneBin continuously improves by ingesting user-consented, real-world edge waste scans into fine-tuning sets:

1. **Pull and organize edge dataset**:
   ```bash
   python scripts/sync_training_data.py
   ```
   This pulls verified images and metadata from Supabase and organizes them into the 12 fine-grained classes under `real/<class>/<id>.jpg`.

2. **Fine-tune the model with real-world edge data**:
   ```bash
   python train.py --extra real --init checkpoints/best.pt --epochs 4 --lr 1e-4
   ```

3. **Re-export to ONNX**:
   ```bash
   python export_onnx.py --checkpoint checkpoints/best.pt --output public/models/onebin.onnx
   ```

---

## Team & Attribution
- Project by University of Washington CSE students.
- Special thanks to Seattle Public Utilities for open waste diversion guidelines.
