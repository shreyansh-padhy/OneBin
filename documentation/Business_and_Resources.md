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

| Component | Technology | Purpose |
|---|---|---|
| **Repository & Automation** | [GitHub](https://github.com/shreyansh-padhy/OneBin) | Source code management, version control, multi-agent PR workflows, and automated CI/CD checks. |
| **Inference Engine** | In-Browser ONNX Runtime (`onnxruntime-web` / WASM) | 100% client-side inference using `onebin.onnx` (FP16, 41.7MB) with WebAssembly threads and SIMD. **Zero external API keys required.** |
| **Frontend & CDN** | [Vercel](https://vercel.com/) | Cloud hosting, frontend presentation layer, fast global Edge CDN for static model weight delivery, and COOP/COEP headers. |
| **Baseline Machine Learning** | PyTorch / EfficientNetV2-S / Gradio / ONNX | Offline training, evaluation, and export pipeline (`train.py`, `bins.py`, `export_onnx.py`) classifying across 12 Seattle fine-grained categories mapped to the 3 bins. |
| **Realtime Telemetry (Optional)** | [Supabase](https://supabase.com/) | Managed PostgreSQL + Realtime WebSockets for live hackathon presentation dashboards and scan event telemetry. |

---

## 4. Resource Suite & Available Capabilities

### 4.1 GitHub (Student Developer Pack)
- **Unlimited Private Repositories & Actions**: Automated CI/CD runs on every push and pull request via [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), verifying linting and Next.js builds.
- **Branch Protection & Automated PR Audits**: Enforces code stability before merging features to `main`.
- **Zero API Dependency**: GitHub Actions requires no external third-party API tokens to verify builds.

### 4.2 Vercel Cloud Platform
- **Live Production Deployment**: Active and live at [https://onebin.vercel.app](https://onebin.vercel.app).
- **Global Edge CDN**: Delivers the Next.js bundle and the static `onebin.onnx` model (41.7MB) with aggressive HTTP caching (`Cache-Control: public, max-age=31536000, immutable`), ensuring sub-second initial load and instant cached reloads.
- **Cross-Origin Isolation**: Configured in `next.config.mjs` with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` to enable multi-threaded WebAssembly execution.
- **Vercel Blob Storage (1GB Free Tier)**: Can store anonymized user scan images for model retraining or auditing without provisioning S3 buckets.
- **Vercel Edge Config**: Sub-15ms globally replicated key-value store, useful for updating municipal sorting rules or threshold settings dynamically without redeploying code.

### 4.3 Supabase (PostgreSQL + Realtime)
- **Live Presentation Dashboard**: Stream real-time scan events (`scan_id`, `bin_verdict`, `confidence`, `timestamp`) over Supabase Realtime WebSockets to a live scoreboard or projector during judging.
- **Diversion Analytics**: Compute cumulative landfill diversion rates and contamination prevention stats dynamically in SQL.
- **REST & GraphQL Instant APIs**: Queryable via auto-generated TypeScript clients without manual backend scaffolding.

---

## 5. Model Execution & Hosting Strategy: Docker vs. Vercel vs. In-Browser

### ❓ Do we need Docker for containing the model?
**Answer: NO. Docker is completely unnecessary.**

### Architectural Breakdown:
1. **Why Traditional Cloud Models Need Docker**:
   - Serving PyTorch in Python requires heavy C++ libraries, CUDA drivers, and Python runtime dependencies, resulting in a 1.5 GB – 4.0 GB container.
   - Traditional setups package this inside a Docker image deployed to AWS ECS, GCP Cloud Run, or RunPod.
   - Vercel Serverless Functions have an uncompressed bundle size limit of **50 MB** (max 250 MB on pro plans) and short execution timeouts (10s–60s), meaning raw PyTorch cannot be hosted inside standard Vercel serverless functions.

2. **How OneBin Solved This Without Docker**:
   - The team authored [`export_onnx.py`](../export_onnx.py) which quantizes and converts the trained PyTorch checkpoint (`checkpoints/best.pt`) into an **ONNX FP16 graph (`public/models/onebin.onnx`, 41.7 MB)**.
   - Vercel serves `onebin.onnx` as a standard static asset via its global Edge CDN.
   - The user's web browser downloads the model once and loads it directly into client-side RAM using **`onnxruntime-web`**.
   - Inference runs **100% inside the browser** using WebAssembly (WASM) with CPU SIMD or WebGL GPU acceleration.

3. **Advantages of the Zero-Docker, Zero-API-Key Architecture**:
   - **Zero Cloud Compute Costs**: $0 hosting bill. Vercel only serves static bytes; compute happens on the user's client hardware.
   - **Ultra-Low Latency**: Frame classification executes in **~20ms – 50ms**, eliminating network round-trips.
   - **100% Privacy & Offline Capability**: Camera frames never leave the user's device.
   - **Zero Cold Starts**: No waiting for Docker containers to spin up from sleep.
