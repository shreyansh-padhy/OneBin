# OneBin: Phase 1 Atomic Task Breakdown

**Author**: Idea Agent (`37c49000-b853-46b7-a7ac-99fccc7efc1f`)  
**Target Execution Agent**: Builder Agent  
**Auditing Agent**: Auditor Agent (`cf506aec-8778-4065-af52-8112e7feeff2`)  
**Phase Objective**: Transition from local Python/Gradio prototype to a production-ready, cloud-deployable web application on **Vercel** powered by an **in-browser ONNX WebAssembly** neural network for instant, zero-cost, zero-API-key waste categorization into Compost, Recycling, and Trash adhering to Seattle Public Utilities rules.

---

## Architecture Overview (Pure Edge WebAssembly)

```
[User Browser / Mobile Camera]
       │
       ▼ (Instant Local Image Capture / Center-Crop 320x320)
[onnxruntime-web (WASM + SIMD Threads)]
   • Model: onebin.onnx (FP16, 41.7MB)
   • 12 Seattle fine-grained classes -> 3 municipal bins
   • Runs 100% on client device CPU/GPU
   • Zero cloud latency (~20ms - 50ms)
   • Zero external API keys, Zero compute costs
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ On-Device Verdict Presentation Card                    │
│ • Clear Bin Target (Compost / Recycling / Trash)       │
│ • Item Identification & Summed Bin Probabilities (%)   │
│ • Seattle Rules & Contamination Warnings (e.g. Battery)│
│ • Low Confidence Guardrail ("When in doubt, trash")    │
│ • Measured On-Device Inference Speed (ms)              │
└────────────────────────────────────────────────────────┘
```

---

> **Phase 1 Architecture (Client-Side ONNX Engine)**: The web app executes 100% locally in the user's browser. Vercel acts as a high-performance static host and Edge CDN delivering the Next.js bundle and model weights. No external API keys (including Gemini API) or serverless backend containers (Docker) are required.

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
