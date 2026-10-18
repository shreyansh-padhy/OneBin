# OneBin: Phase 1 Atomic Task Breakdown

**Author**: Idea Agent (`37c49000-b853-46b7-a7ac-99fccc7efc1f`)  
**Target Execution Agent**: Builder Agent  
**Auditing Agent**: Auditor Agent (`cf506aec-8778-4065-af52-8112e7feeff2`)  
**Phase Objective**: Transition from local Python prototype to a facility-grade, cloud-deployable sorting intelligence system on **Vercel** powered by an **in-browser ONNX WebAssembly** neural network for instant, zero-cost, zero-API-key waste classification into Compost, Recycling, and Trash adhering to Seattle Public Utilities rules.

---

## Architecture Overview (Facility Sorting Intelligence)

> **The OneBin Core Concept**: Citizens use **ONE SINGLE BIN** ("OneBin"), eliminating consumer sorting fatigue and curbside contamination. All mixed municipal waste is collected together and processed downstream at **centralized municipal recovery facilities (MRFs) / sorting centers**, where OneBin's computer vision and automated mechanical actuators classify and separate the stream into Compost, Recycling, and Trash. All sensing is **100% visual/optical (zero microphones)**.

```
[Unified Municipal Waste Stream (Single Bin for Consumers)]
                         │
                         ▼ (Transported to Municipal Recovery Facility)
[Facility Camera / Conveyor Chute (100% Optical - Zero Microphones)]
                         │
                         ▼ (Instant Local Frame Capture / Center-Crop 320x320)
[onnxruntime-web (WASM + SIMD Threads)]
   • Model: onebin.onnx (FP16, 41.7MB)
   • 12 Seattle fine-grained classes -> 3 municipal streams
   • Runs 100% on facility terminal / browser
   • Zero cloud latency (~20ms - 50ms)
   • Zero external API keys, Zero compute costs
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[Physical IoT Servo Diverter]     [Facility Stage Telemetry]
• Web Serial API (9600 baud)      • /dashboard
• Mechanical sorting actuation    • Real-time throughput & diversion stats
• Arduino firmware (Uno / ESP32)  • BroadcastChannel / Supabase
```

---

> **Phase 1 Architecture (Facility Edge ONNX Engine)**: The application executes 100% locally on the facility terminal. Vercel acts as a static host and Edge CDN delivering the Next.js bundle and model weights. No external API keys (zero Gemini API keys) or serverless backend containers (Docker) are required. All sensing is visual with zero microphone inputs.

## Atomic Task List

### Task 1.1: Project Scaffolding & Vercel Configuration
- **Status**: `[COMPLETED]` (PR #1 Merged, CI Passed)
- **Target Files**:
  - `package.json`
  - `tsconfig.json`
  - `next.config.mjs`
  - `vercel.json`
  - `.env.example`
  - `.gitignore`
- **Objective**: Establish the modern TypeScript/Next.js 15 web application workspace configured for seamless zero-config deployment on Vercel with COOP/COEP cross-origin isolation headers for WASM threads.
- **Acceptance Criteria**:
  - `npm run build` succeeds locally without linting or TypeScript compilation errors.
  - Vercel production deployment live at `https://onebin.vercel.app`.

---

### Task 1.2: Serverless Gemini Vision API Route with Structured JSON Output
- **Status**: `[COMPLETED]` (Builder Agent, PR #8)
- **Target Files**:
  - `app/api/classify/route.ts`
  - `lib/gemini.ts`
  - `lib/types.ts`
- **Architectural Implementation**: Hybrid multimodal route calling Gemini 2.5 Flash via `@google/genai` with structured JSON schema (`responseSchema`) enforcing Seattle municipal rules (compost/recycling/trash, plastic bags -> trash, styrofoam -> trash, batteries -> trash with hazard warning, <60% confidence -> lowConfidenceWarning). Provides deep material analysis and regulatory rationale on demand alongside zero-latency client-side ONNX inference.

---

### Task 1.3: Responsive Camera & Upload UI Component
- **Status**: `[COMPLETED]` (Claude Agent & Builder Agent, PR #7 Merged)
- **Target Files**:
  - `components/CameraCapture.tsx`
  - `components/Sorter.tsx`
- **Objective**: Build an intuitive image capture and file upload interface optimized for both mobile devices and desktops.
- **Current State**: Center-crops to 320×320 in-browser; integrates drag-and-drop file upload, live mobile/desktop camera feed, and canvas pre-processing matching `train.py`.

---

### Task 1.4: Classification Results Card & Visual Feedback Component
- **Status**: `[COMPLETED]` (Claude Agent & Builder Agent, PR #7 Merged)
- **Target Files**:
  - `components/VerdictCard.tsx`
  - `lib/classifier.ts`
- **Objective**: Design and build the primary presentation view displaying the waste sorting verdict, confidence score, fine-class probabilities, safety warnings, and on-device execution time.
- **Current State**: Displays verified bin color coding, top item predictions, hazardous battery warnings, low-confidence warning (<60%), and exact execution time in milliseconds.

---

### Task 1.5: End-to-End Integration, CI/CD & Production Verification
- **Status**: `[COMPLETED]`
- **Target Files**:
  - `README.md`
  - `.github/workflows/ci.yml`
  - `documentation/CollabWorkflow.md`
  - `app/page.tsx`
- **Objective**: Verify end-to-end user classification loop, clean CI pipeline without external secret requirements, and verify production deployment.
- **Acceptance Criteria**:
  - Zero hydration errors in Next.js.
  - Fast, responsive camera and upload sorting flow.
  - Production build live and operational on Vercel at `https://onebin.vercel.app`.

---

## Phase 2 Backlog Execution (P1 - P5)

### P1: Model Checkpoint & Git LFS Tracking
- **Status**: `[COMPLETED]` (Merged via PR #9)
- **Target Files**: `checkpoints/best.pt`, `evaluate.py`, `.gitattributes`, `.gitignore`
- **Delivered**: Merged `origin/model/combined-12class` into `main`, tracking the PyTorch 12-class model artifact via Git LFS alongside the browser runtime.

### P2: Continuous Auto-Scan Mode
- **Status**: `[COMPLETED]`
- **Target Files**: `components/CameraCapture.tsx`, `components/Sorter.tsx`
- **Delivered**: Continuous low-frequency frame inspection loop (900ms interval) with HUD scanning reticle pulse, allowing hands-free automatic waste sorting without closing the camera view.

### P3: Sustainability Impact & History Telemetry
- **Status**: `[COMPLETED]`
- **Target Files**: `lib/supabase.ts`, `components/StatsModal.tsx`
- **Delivered**: Client-side scan telemetry with local persistence and optional Supabase REST sync. Features an Impact Dashboard calculating total scans, % diverted from landfill, and estimated CO₂ equivalent saved.

### P4: Physical IoT Smart Bin Actuation (Web Serial API)
- **Status**: `[COMPLETED]`
- **Target Files**: `lib/serial.ts`, `components/Sorter.tsx`, `components/VerdictCard.tsx`
- **Delivered**: Browser Web Serial connection (`navigator.serial`) at 9600 baud sending physical lid actuation commands (`'C\n'` Compost, `'R\n'` Recycling, `'T\n'` Trash) to connected Arduino/ESP32 hardware.

---

## Phase 3: Production Cloud Telemetry & Active Learning Pipeline

### Task 3.1: Supabase Realtime Telemetry WebSocket Subscription
- **Status**: `[READY FOR BUILDER]`
- **Target Files**: `lib/supabase.ts`, `app/dashboard/page.tsx`
- **Objective**: Wire up `supabase.channel('realtime:scans')` to listen to live `INSERT` events on the `scans` table, allowing stage presentation dashboards to increment live waste counts and diversion metrics globally without page refreshes.
- **Acceptance Criteria**:
  - `subscribeToLiveScans` registers a Postgres changes channel when `supabase` client is initialized.
  - Automatically unregisters channel on cleanup.
  - Falls back to `BroadcastChannel` and `localStorage` when offline or unconfigured.

### Task 3.2: Supabase Storage & Telemetry Database Schema Script
- **Status**: `[COMPLETED]` (Committed in PR #15, Schema executed on Supabase)
- **Target Files**: `supabase/schema.sql`
- **Objective**: Provide an automated, idempotent SQL migration script configuring the `scans` table, indexes on `created_at` and `bin`, `supabase_realtime` publication enablement, `waste-dataset` storage bucket definition with permissive insert policies, and a `get_bin_analytics()` RPC function computing diversion rates.
- **Delivered**: `supabase/schema.sql` committed and verified live on Supabase project `diiyljscftybrygsokdf` with RLS policies, `scans` table, `waste-dataset` bucket, and `get_bin_analytics()` RPC.

### Task 3.3: Vercel Web Analytics & Speed Insights
- **Status**: `[READY FOR BUILDER]`
- **Target Files**: `app/layout.tsx`, `package.json`
- **Objective**: Install `@vercel/analytics` and `@vercel/speed-insights` and embed them into `RootLayout` in `app/layout.tsx` for zero-configuration kiosk latency and user engagement metrics on Vercel.
- **Acceptance Criteria**:
  - `npm run build` succeeds without bundle bloat.
  - `<Analytics />` and `<SpeedInsights />` mounted at root layout.

### Task 3.4: Automated 3-Way Integration & Connectivity Health Check
- **Status**: `[READY FOR BUILDER]`
- **Target Files**: `scripts/verify_3way_connection.mjs`, `package.json`
- **Objective**: Build an automated integration verification script that programmatically tests all three connected services:
  1. **GitHub $\rightarrow$ Vercel**: Verifies latest commit SHA is deployed and returns HTTP 200 with COOP/COEP headers.
  2. **Vercel $\rightarrow$ Supabase**: Verifies Vercel environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) are present and valid.
  3. **Supabase Operations**: Executes end-to-end telemetry insertion, row readback, RPC analytics query (`get_bin_analytics`), and storage bucket file listing on `waste-dataset`.
- **Acceptance Criteria**:
  - `npm run verify` runs the automated health check and outputs a clean green pass/fail matrix.
  - Zero sensitive service keys leaked (runs strictly with public `anon` credentials).

### Task 3.5: Active Learning Training Ingestion Pipeline (`scripts/sync_training_data.py`)
- **Status**: `[READY FOR BUILDER]`
- **Target Files**: `scripts/sync_training_data.py`, `README.md`
- **Objective**: Build a Python CLI utility that connects to Supabase, pulls all user-consented and ground-truth verified waste photos and labels from the `waste-dataset` storage bucket and `scans` table, and organizes them into `real/{fine_class}/{id}.jpg` for seamless model fine-tuning with `train.py`.
- **Architectural Constraints & Acceptance Criteria**:
  - Reads credentials from `.env.local` or environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
  - Maps user material chip selections (🥫 Metal, 📄 Paper, 📦 Cardboard, 🧴 Plastic, 🍾 Glass, 🍎 Food -> biological, etc.) to the 12 fine classes defined in `bins.py`.
  - Downloads images into `real/<fine_class>/` with deduplication by scan ID.
  - Displays a summary table of newly downloaded training samples.
  - Verifiable compatibility: directory format directly accepted by `python train.py --extra real --init checkpoints/best.pt`.

