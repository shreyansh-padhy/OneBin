# OneBin: Business & Resources

## 1. Project Overview & Pitch
**OneBin** is an automated waste classification and mechanical sorting intelligence platform engineered for deployment inside **centralized municipal recovery facilities (MRFs), waste transfer stations, and industrial processing centers**.

### The Core Paradigm: Single-Stream Collection, Centralized Facility Separation
Today's municipal waste model forces citizens and businesses to manually segregate waste into three separate bins (Trash, Compost, Recycling). This curbside paradigm is fundamentally broken:
- **Consumer Confusion & Sorting Fatigue**: Everyday consumers struggle with ambiguous items (e.g., food-soiled pizza boxes, plastic bags, styrofoam, wax-lined coffee cups).
- **Catastrophic Batch Contamination**: A single non-recyclable plastic film or food scrap can contaminate and ruin an entire multi-ton recycling bale, costing municipalities millions in landfill tipping fees and generating massive methane emissions.
- **The OneBin Solution**: Everyday households and businesses have **ONE SINGLE BIN** ("OneBin") instead of three separate bins. Zero sorting burden or confusion is placed on the consumer.
- **Centralized Facility Intelligence**: All municipal waste is collected as a single stream and transported to centralized recovery facilities. OneBin's high-speed computer vision software is deployed directly on facility sorting lines and conveyor chutes, pairing visual classification with automated mechanical actuation (servos, pneumatic air jets, robotic diverters) to sort items into:
  1. **🟢 Compost / Organics**
  2. **🔵 Recycling (Cardboard, Paper, Clean Metals, Rigid Plastics)**
  3. **⚫ Trash / Landfill**

### Optical Sensing Pipeline (Zero Microphone Dependency)
- **100% Visual & Optical**: The classification pipeline relies strictly on high-speed camera frames capturing items on conveyor belts or sorting chutes.
- **No Microphone or Audio Inputs**: OneBin uses **zero microphone or audio sensor inputs**. All identification, material decomposition, and Seattle municipal rule enforcement are performed via computer vision and neural network feature extraction.

---

## 2. Team Structure & Responsibilities
The project is built by a two-person human engineering team:
1. **Model & CV Engineer**: Focuses on model training, fine-tuning, dataset curation, and computer vision pipelines. (Currently training checkpoint 4 on the combined benchmark).
2. **Architecture & Full-Stack Engineer**: Designs system architecture, multi-agent workflows, facility telemetry dashboards, IoT actuation protocols, and cloud infrastructure.

---

## 3. Technology Stack & Current Resources

| Component | Technology | Usage Status | Role in OneBin |
|---|---|---|---|
| **Repository & Automation** | [GitHub](https://github.com/shreyansh-padhy/OneBin) | **Active (In Use)** | Source code management, multi-agent PR workflows, and automated CI/CD checks via GitHub Actions. |
| **Facility Inference Engine** | In-Browser / On-Device ONNX Runtime (`onnxruntime-web` / WASM) | **Active (In Use)** | 100% client-side inference using `onebin.onnx` (FP16, 41.7MB) with WebAssembly threads and SIMD. **Zero external API keys required.** |
| **Facility Dashboard & Static CDN** | [Vercel](https://vercel.com/) (Free Hobby Tier) | **Active (In Use)** | Hosting Next.js 15 App Router at `https://onebin.vercel.app`, serving the 41.7MB ONNX model over Vercel Edge CDN, and setting COOP/COEP isolation headers. |
| **Baseline Machine Learning** | PyTorch / EfficientNetV2-S / Gradio / ONNX | **Active (Local Training Only)** | Offline training pipeline (`train.py`, `bins.py`, `export_onnx.py`) currently iterating on the combined dataset benchmark across 12 Seattle fine-grained categories. |
| **Facility Telemetry & Stage Sync** | [Supabase](https://supabase.com/) & BroadcastChannel | **Active & Available** | Real-time cross-tab synchronization and PostgreSQL telemetry for live recovery facility dashboards and diversion tracking. |
| **Industrial IoT Actuation** | Web Serial API / Arduino C++ Firmware | **Active (In Use)** | Direct USB/Serial hardware control (`firmware/arduino_bins.ino`) driving physical sorting servo diverters based on classification verdicts. |

---

## 4. Resource Accounting: Active Usage & Free Tier Capabilities

### 4.1 GitHub (Active — Student / Free Tier)
- **Status**: **Fully Active in Production**
- **What We Are Currently Using**:
  - Main repository: `shreyansh-padhy/OneBin`
  - Automated CI/CD pipeline: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) triggers on every push and pull request, executing `npm run lint` and `npm run build`.
  - Automated Continuous Deployment: Workflow automatically pushes validated `main` builds to Vercel using repository secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
  - Zero third-party API dependencies needed for CI runs.

### 4.2 Vercel (Active — Free Hobby Tier)
- **Status**: **Fully Active in Production**
- **Tier**: **Free Hobby Tier**
- **What We Are Currently Using**:
  - **Live URL**: [https://onebin.vercel.app](https://onebin.vercel.app) (Project ID: `prj_Lk1LvMVpfZZq6MP3UFLfPsoVI5Lf`).
  - **Static Weight CDN**: Vercel serves `public/models/onebin.onnx` (41.7MB) globally. Free Hobby tier includes **100 GB/month bandwidth**, which accommodates over 2,000 cold model downloads during facility testing and hackathon judging, with infinite cached reloads.
  - **Cross-Origin Isolation**: Configured in `next.config.mjs` with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to enable browser `SharedArrayBuffer` for multi-threaded WASM inference.
- **Additional Free Tier Features Available to Use**:
  - **Vercel Blob Storage** (Free: 1GB storage, 5GB bandwidth/month): Can store facility edge-case images for model retraining or auditing without provisioning S3 buckets.
  - **Vercel Edge Config** (Free: 1 store, 8KB size, 50,000 reads/month): Sub-15ms globally replicated key-value store to toggle municipality-specific sorting rules dynamically without redeploying code.

### 4.3 Supabase (Available — Free Tier)
- **Status**: **Available / Ready to Integrate**
- **Tier**: **Free Tier ($0/month)**
- **Free Tier Entitlements**:
  - **500 MB** PostgreSQL database storage
  - **200 concurrent Realtime connections** (WebSockets)
  - **50,000 monthly active users**
  - **5 GB bandwidth / egress** per month
  - Auto-generated REST and GraphQL APIs with instant TypeScript generation
- **Facility Use Case**:
  - **Facility Telemetry Dashboard**: Connect Supabase Realtime so that as conveyor cameras classify items, a live facility scoreboard ([onebin.vercel.app/dashboard](https://onebin.vercel.app/dashboard)) displays sorting throughput, contamination prevention rates, and mechanical diverter status in real time.
  - **Diversion Analytics**: Query running statistics (e.g., total items sorted, % diverted to compost/recycling, hazardous items flagged).

---

## 5. Model Execution & Hosting Strategy: Docker vs. Vercel vs. In-Browser

### ❓ Do we need Docker for containing the model?
**Answer: NO. Docker is completely unnecessary.**

### Architectural Breakdown:
1. **The Only Local Component is Training**:
   - Model training is performed offline on local developer machines via PyTorch (`train.py`) utilizing local GPUs. (Currently on the 4th checkpoint; weights will be finalized and exported once training is complete).
   - Once training is finalized, [`export_onnx.py`](../export_onnx.py) converts and quantizes the PyTorch model into an **ONNX FP16 graph (`public/models/onebin.onnx`, 41.7 MB)**.

2. **Why Server-Side Containers (Docker) Are Not Needed**:
   - Serving PyTorch in Python on a server requires a 1.5 GB – 4.0 GB Docker container with C++ libraries and CUDA drivers (running on AWS ECS, GCP Cloud Run, or RunPod).
   - Vercel Serverless Functions have a 50 MB uncompressed limit and execution timeouts, making raw server-side PyTorch infeasible on Vercel without external container infrastructure.
   - However, because our model is in ONNX format, **Vercel serves the model as a static file, and inference runs 100% inside the facility terminal browser via WebAssembly (`onnxruntime-web`)**.

3. **Advantages for Facilities & Production**:
   - **$0 Infrastructure Cost**: Operates comfortably within Vercel's Free Hobby Tier limits.
   - **Ultra-Low Latency**: Inference executes in **~20ms – 50ms** directly on facility client hardware.
   - **100% Privacy & Offline Capability**: Camera frames never leave the facility's local network.
   - **Zero Cold Starts**: No waiting for Docker containers to spin up from idle.
