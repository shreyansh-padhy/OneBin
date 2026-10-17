# OneBin: Business & Resources

## 1. Project Overview & Pitch
**OneBin** is an AI-powered waste classification and automated sorting system engineered for hackathon presentation and real-world deployment. By combining computer vision with on-device WebAssembly machine learning, OneBin categorizes household and commercial waste items into three distinct municipal streams:
- **Compost**
- **Recycling**
- **Trash**

### Core Business Pitch
Improper waste sorting leads to recycling batch contamination, organic waste in landfills generating methane, and massive financial penalties for municipalities and recycling facilities. OneBin automates point-of-disposal classification using intelligent visual recognition. Users simply present an item to a camera, and the system delivers instant, transparent classification with confidence scores and sorting rationale.

---

## 2. Team Structure & Responsibilities
The project is built by a two-person human engineering team:
1. **Model & CV Engineer**: Focuses on model training, fine-tuning, dataset curation, and computer vision pipelines.
2. **Architecture & Full-Stack Engineer**: Designs system architecture, multi-agent workflows, API integrations, and frontend deployment.

---

## 3. Technology Stack & Current Resources

| Component | Technology | Usage Status | Role in OneBin |
|---|---|---|---|
| **Repository & Automation** | [GitHub](https://github.com/shreyansh-padhy/OneBin) | **Active (In Use)** | Source code management, multi-agent PR workflows, and automated CI/CD checks via GitHub Actions. |
| **Inference Engine** | In-Browser ONNX Runtime (`onnxruntime-web` / WASM) | **Active (In Use)** | 100% client-side inference using `onebin.onnx` (FP16, 41.7MB) with WebAssembly threads and SIMD. **Zero external API keys required.** |
| **Frontend & Static CDN** | [Vercel](https://vercel.com/) (Free Hobby Tier) | **Active (In Use)** | Hosting Next.js 15 App Router at `https://onebin.vercel.app`, serving the 41.7MB ONNX model over Vercel Edge CDN, and setting COOP/COEP isolation headers. |
| **Baseline Machine Learning** | PyTorch / EfficientNetV2-S / Gradio / ONNX | **Active (Local Training Only)** | Offline training, evaluation, and export pipeline (`train.py`, `bins.py`, `export_onnx.py`) classifying across 12 Seattle fine-grained categories mapped to 3 bins. |
| **Realtime Telemetry & Data** | [Supabase](https://supabase.com/) (Free Tier) | **Available (Ready to Enable)** | Managed PostgreSQL + Realtime WebSockets for live hackathon presentation dashboards and scan event telemetry. |

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
  - **Static Weight CDN**: Vercel serves `public/models/onebin.onnx` (41.7MB) globally. Free Hobby tier includes **100 GB/month bandwidth**, which accommodates over 2,000 cold model downloads during hackathon testing, and infinite cached reloads.
  - **Cross-Origin Isolation**: Configured in `next.config.mjs` with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to enable browser `SharedArrayBuffer` for multi-threaded WASM inference.
- **Additional Free Tier Features Available to Use**:
  - **Vercel Blob Storage** (Free: 1GB storage, 5GB bandwidth/month): Can store user scan photos for model auditing or active learning if desired.
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
- **How OneBin Can Leverage It for Hackathon Demo**:
  - **Live Presentation Dashboard**: Connect Supabase Realtime so that when judges or users scan items on mobile at [onebin.vercel.app](https://onebin.vercel.app), a live projector/scoreboard display updates instantly over WebSockets.
  - **Diversion Analytics**: Query running statistics (e.g., total items scanned, % diverted to compost/recycling, contamination incidents prevented).

---

## 5. Model Execution & Hosting Strategy: Docker vs. Vercel vs. In-Browser

### ❓ Do we need Docker for containing the model?
**Answer: NO. Docker is completely unnecessary.**

### Architectural Breakdown:
1. **The Only Local Component is Training**:
   - Training is performed offline on local developer machines via PyTorch (`train.py`) utilizing local GPUs to produce `checkpoints/best.pt`.
   - Once trained, [`export_onnx.py`](../export_onnx.py) converts and quantizes the PyTorch model into an **ONNX FP16 graph (`public/models/onebin.onnx`, 41.7 MB)**.

2. **Why Server-Side Containers (Docker) Are Not Needed**:
   - Serving PyTorch in Python on a server requires a 1.5 GB – 4.0 GB Docker container with C++ libraries and CUDA drivers (running on AWS ECS, GCP Cloud Run, or RunPod).
   - Vercel Serverless Functions have a 50 MB uncompressed limit and execution timeouts, making raw server-side PyTorch infeasible on Vercel without external container infrastructure.
   - However, because our model is in ONNX format, **Vercel serves the model as a static file, and inference runs 100% inside the user's browser via WebAssembly (`onnxruntime-web`)**.

3. **Advantages for Hackathon & Live Production**:
   - **$0 Infrastructure Cost**: Operates comfortably within Vercel's Free Hobby Tier limits.
   - **Ultra-Low Latency**: Inference executes in **~20ms – 50ms** directly on the user's device CPU/GPU.
   - **100% Privacy & Offline Capability**: Camera frames never leave the user's browser.
   - **Zero Cold Starts**: No waiting for Docker containers to spin up from idle.
