# OneBin: Phase 1 Atomic Task Breakdown

**Author**: Idea Agent (`37c49000-b853-46b7-a7ac-99fccc7efc1f`)  
**Target Execution Agent**: Builder Agent  
**Auditing Agent**: Auditor Agent  
**Phase Objective**: Transition from local Python/Gradio prototype to a production-ready, cloud-deployable web application on **Vercel** powered by **Google Gemini API** multimodal vision for zero-shot waste categorization into Compost, Recycling, and Trash.

---

## Architecture Overview (Hybrid Edge + Cloud AI)

```
[User Browser / Mobile Camera]
       │
       ├─────────────────────────────────────────┐
       ▼ (Instant Local Inference: <50ms)        ▼ (Deep Multimodal Analysis)
[ONNX Runtime Web (WASM)]               [POST /api/classify - Next.js Route]
   • EfficientNetV2-S (12 classes)               │
   • Runs 100% in-browser                        ▼ (Secure GEMINI_API_KEY)
   • Zero cloud latency                  [Google Gemini 2.5 Flash / Pro]
       │                                         │
       │                                         ▼ (Structured JSON)
       │                                   • Contamination Alerts
       │                                   • Sorting Rationale
       │                                   • Multi-Material Disassembly
       ▼                                         │
┌────────────────────────────────────────────────┴────────────────────────┐
│ Hybrid Verdict Card: Instant Prediction + AI Rationale & Safety Warnings │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Atomic Task List

### Task 1.1: Project Scaffolding & Vercel Configuration
- **Status**: `[COMPLETED]` (PR #1 Merged, CI Passed)
- **Target Files**:
  - `package.json`
  - `tsconfig.json`
  - `next.config.js` (or `vite.config.ts` if SPA)
  - `vercel.json`
  - `.env.example`
  - `.gitignore` (update for Node.js / Vercel artifacts)
- **Objective**: Establish the modern TypeScript/Next.js (App Router or Pages Router) web application workspace in the root or `/web` directory, configured for seamless zero-config deployment on Vercel.
- **Actionable Steps**:
  1. Initialize a lightweight Next.js project with TypeScript and Tailwind CSS for rapid, modern styling.
  2. Configure `.env.example` defining `GEMINI_API_KEY` and optional configuration variables.
  3. Ensure `.gitignore` ignores `.env*`, `.next/`, `node_modules/`, and build artifacts while preserving Python baseline scripts.
  4. Verify project build command (`npm run build`) runs cleanly without errors.
- **Acceptance Criteria**:
  - `npm run build` succeeds locally without linting or TypeScript compilation errors.
  - Environment variable schema is documented in `.env.example`.

---

### Task 1.2: Serverless Gemini Vision API Route with Structured JSON Output
- **Status**: `[PENDING - GREENLIT FOR BUILDER]`
- **Target Files**:
  - `app/api/classify/route.ts`
  - `lib/gemini.ts` (API client & schema definition)
  - `lib/types.ts` (TypeScript interfaces for API request/response)
- **Objective**: Create a secure serverless backend endpoint that receives an image payload, calls the Google Gemini API with multimodal vision capabilities, and enforces structured JSON output for deep sorting rationale and contamination warnings.
- **Actionable Steps**:
  1. Define the TypeScript interface for classification results in `lib/types.ts`:
     ```typescript
     export interface ClassificationResult {
       bin: 'compost' | 'recycling' | 'trash';
       itemName: string;
       material: string;
       confidence: number; // 0.0 - 1.0
       rationale: string;
       warnings?: string[];
       lowConfidenceWarning: boolean;
     }
     ```
  2. Implement Gemini API client in `lib/gemini.ts` using `@google/genai` (pinned `^2.30.0`):
     - Initialize `GoogleGenAI` reading `process.env.GEMINI_API_KEY`.
     - Model: `gemini-2.5-flash` by default (read from `process.env.GEMINI_MODEL || 'gemini-2.5-flash'`).
     - Enforce structured output via `responseSchema`.
  3. Configure system instructions aligning classification with `bins.py` standards (Seattle municipal rules):
     - Biological / food waste / yard waste -> `compost`
     - Clean cardboard, glass, metal, paper, rigid recyclable plastics -> `recycling`
     - Seattle Specific Heuristics: Plastic shopping/trash bags (`plastic_bag`) and foam containers/cups (`styrofoam`) -> MUST go to `trash`.
     - Specific hazardous item warnings (e.g. lithium-ion batteries, chemicals, electronics).
     - Strict rule: If uncertain or item is food-soiled, assign to `trash` or flag `lowConfidenceWarning: true`.
  4. Implement `app/api/classify/route.ts` handling POST requests with base64 image data.
  5. Include defensive error handling for missing API keys, rate limits, and network timeouts.
- **Acceptance Criteria**:
  - POST request with a sample image returns HTTP 200 with valid, schema-compliant JSON.
  - Plastic bags and styrofoam are strictly classified as `trash` with appropriate explanations.
  - API key is never exposed to the client bundle.
  - Returns clear HTTP 400/500 JSON error responses for invalid inputs or upstream errors.

---

### Task 1.3: Responsive Camera & Upload UI Component
- **Status**: `[IMPLEMENTED ON BRANCH: feat/in-browser-classifier]`
- **Target Files**:
  - `components/CameraCapture.tsx`
  - `components/Sorter.tsx`
- **Objective**: Build an intuitive image capture and file upload interface optimized for both mobile devices and desktops.
- **Current State**: Implemented on branch `feat/in-browser-classifier` by Claude Agent; pending merge into `main`.

---

### Task 1.4: Classification Results Card & Visual Feedback Component
- **Status**: `[IMPLEMENTED ON BRANCH: feat/in-browser-classifier]`
- **Target Files**:
  - `components/VerdictCard.tsx`
  - `components/Sorter.tsx`
- **Objective**: Design and build the primary presentation view displaying the waste sorting verdict, confidence score, rationale, and safety warnings.
- **Current State**: Implemented on branch `feat/in-browser-classifier` by Claude Agent; pending merge into `main` and connection with Task 1.2 for Gemini AI deep explanations.

---

### Task 1.5: End-to-End Integration, PR Merge & Live Deployment Verification
- **Status**: `[PENDING]`
- **Target Files**:
  - `README.md`
  - `documentation/CollabWorkflow.md`
  - `components/Sorter.tsx`
  - `components/VerdictCard.tsx`
- **Objective**: Merge `feat/in-browser-classifier` into `main`, wire the hybrid flow (instant ONNX result + Gemini explanation), verify the automated CI/Vercel deployment, and document setup.
- **Actionable Steps**:
  1. Open PR and merge `feat/in-browser-classifier` into `main`.
  2. Wire `components/VerdictCard.tsx` / `components/Sorter.tsx` to optionally call `/api/classify` (e.g., "Explain Why with Gemini" button or auto-enrichment on scan).
  3. Verify local build: `npm run lint` and `npm run build`.
  4. Push to `main` to trigger automated Vercel deployment and verify live on `https://onebin.vercel.app`.
  5. Document setup, hybrid architecture, and usage in `README.md`.
- **Acceptance Criteria**:
  - Complete scan flow executes end-to-end both on-device (WASM ONNX) and with Gemini cloud reasoning.
  - Zero hydration errors in Next.js.
  - Production build live and operational on Vercel.

---

## Handoff & Execution Protocol
- **Builder Agent** is currently greenlit to execute **Task 1.2** (`lib/gemini.ts` and `app/api/classify/route.ts`).
- Once Task 1.2 is audited, proceed to **Task 1.5** to merge and integrate the full hybrid application.
