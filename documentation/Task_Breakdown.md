# OneBin: Phase 1 Atomic Task Breakdown

**Author**: Idea Agent (`37c49000-b853-46b7-a7ac-99fccc7efc1f`)  
**Target Execution Agent**: Builder Agent  
**Auditing Agent**: Auditor Agent  
**Phase Objective**: Transition from local Python/Gradio prototype to a production-ready, cloud-deployable web application on **Vercel** powered by **Google Gemini API** multimodal vision for zero-shot waste categorization into Compost, Recycling, and Trash.

---

## Architecture Overview

```
[User Browser / Mobile Camera]
       │
       ▼ (Image Capture: Base64 / Multipart)
[Next.js / React Frontend on Vercel]
       │
       ▼ (POST /api/classify - Server-side proxy)
[Vercel Serverless Function] ──(Secure GEMINI_API_KEY)──► [Google Gemini Multimodal API]
       │                                                         │
       ◄─────────── (Structured JSON Output) ────────────────────┘
       │
       ▼
[Classification Card Display: Bin (Compost/Recycle/Trash) + Confidence + Rationale + Warnings]
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
- **Status**: `[PENDING]`
- **Target Files**:
  - `app/api/classify/route.ts` (or `pages/api/classify.ts`)
  - `lib/gemini.ts` (API client & schema definition)
  - `lib/types.ts` (TypeScript interfaces for API request/response)
- **Objective**: Create a secure serverless backend endpoint that receives an image payload, calls the Google Gemini API with multimodal vision capabilities, and enforces structured JSON output.
- **Actionable Steps**:
  1. Define the TypeScript interface for classification results:
     ```typescript
     interface ClassificationResult {
       bin: 'compost' | 'recycling' | 'trash';
       itemName: string;
       material: string;
       confidence: number; // 0.0 - 1.0
       rationale: string;
       warnings?: string[];
       lowConfidenceWarning: boolean;
     }
     ```
  2. Implement Gemini API client in `lib/gemini.ts` using `@google/genai` or standard REST API endpoints.
  3. Configure system instructions aligning classification with `bins.py` standards:
     - Biological / organic waste -> `compost`
     - Clean cardboard, glass, metal, paper, recyclable plastics -> `recycling`
     - Clothes, shoes, general non-recyclables, hazardous items (with warning) -> `trash`
     - Specific hazardous item warnings (e.g. lithium-ion batteries, chemicals).
     - Strict rule: If uncertain or item is soiled/unrecyclable, assign to `trash` or flag `lowConfidenceWarning: true`.
  4. Implement input validation (handling base64 and multipart file limits, rejecting unsupported MIME types).
  5. Include defensive error handling for missing API keys, rate limits, and network timeouts.
- **Acceptance Criteria**:
  - POST request with a sample waste item image returns HTTP 200 with valid, schema-compliant JSON.
  - API key is never exposed to the client bundle.
  - Returns clear HTTP 400/500 JSON error responses for invalid inputs or upstream errors.

---

### Task 1.3: Responsive Camera & Upload UI Component
- **Status**: `[PENDING]`
- **Target Files**:
  - `components/CameraCapture.tsx`
  - `components/ImageUploader.tsx`
  - `components/Dropzone.tsx`
- **Objective**: Build an intuitive, accessible image capture and file upload interface optimized for both mobile devices (rear camera trigger) and desktops (drag-and-drop / file selector).
- **Actionable Steps**:
  1. Implement HTML5 `MediaDevices.getUserMedia` camera preview with mobile environment facing-mode toggle (`facingMode: "environment"`).
  2. Provide instant snapshot capture with canvas downsampling/compression (e.g., max 1024x1024 or 384x384 matching EfficientNet baseline) to ensure fast payload transmission over cellular networks.
  3. Implement drag-and-drop file upload as a fallback for non-camera desktop testing.
  4. Include live image preview and "Retake / Clear" controls.
- **Acceptance Criteria**:
  - Works on mobile browsers requesting camera permission seamlessly.
  - Desktop users can drag and drop images (.jpg, .png, .webp).
  - Images are compressed client-side before transmission.

---

### Task 1.4: Classification Results Card & Visual Feedback Component
- **Status**: `[PENDING]`
- **Target Files**:
  - `components/VerdictCard.tsx`
  - `components/ConfidenceBar.tsx`
  - `components/WarningBanner.tsx`
  - `app/page.tsx`
- **Objective**: Design and build the primary presentation view displaying the waste sorting verdict, confidence score, rationale, and safety warnings.
- **Actionable Steps**:
  1. Implement color-coded visual hierarchy matching `bins.py`:
     - 🟢 Compost (Green theme)
     - 🔵 Recycling (Blue theme)
     - ⚫ Trash (Dark Gray / Slate theme)
  2. Display primary item identification (e.g. "Aluminum Soda Can") alongside bin recommendation.
  3. Render confidence percentage bar with visual threshold highlight (flags when confidence < 60% with "When in doubt, trash").
  4. Render callout banners for hazardous items (e.g., batteries, e-waste) with drop-off advice.
  5. Provide an expandable drawer or accordion with Gemini's detailed reasoning and material breakdown.
  6. Add loading skeletons and spinners during API processing.
- **Acceptance Criteria**:
  - UI matches the tri-bin color semantics accurately.
  - Handles loading, success, low-confidence warning, and error states gracefully.

---

### Task 1.5: End-to-End Integration, Environment Setup & Deployment Verification
- **Status**: `[PENDING]`
- **Target Files**:
  - `README.md`
  - `documentation/CollabWorkflow.md`
  - `documentation/Business_and_Resources.md`
- **Objective**: Wire all components together in the main application page, verify the local workflow, document setup steps, and ensure the project is ready for one-click Vercel deployment.
- **Actionable Steps**:
  1. Connect `CameraCapture` / `ImageUploader` to `/api/classify` and pipe response into `VerdictCard`.
  2. Test end-to-end scanning flow with sample items from each category:
     - Compost: banana peel / food scraps
     - Recycling: cardboard box / plastic bottle / aluminum can
     - Trash: styrofoam cup / worn shoe / battery (verifying hazardous warning)
  3. Document development and deployment instructions in `README.md` (how to set `GEMINI_API_KEY` on Vercel and locally).
  4. Submit to Auditor Agent for verification.
- **Acceptance Criteria**:
  - Complete scan flow executes end-to-end in < 2 seconds under standard broadband.
  - Zero hydration errors in Next.js.
  - Ready for Vercel deployment without build failures.

---

## Handoff & Execution Protocol
- The **Builder Agent** must pick up tasks in strict sequence (`Task 1.1` -> `Task 1.2` -> `Task 1.3` -> `Task 1.4` -> `Task 1.5`).
- Before starting any task, the Builder Agent must update `CollabWorkflow.md` to `[ACTIVE]`.
- Upon completing each task, the Builder Agent must log progress in the LRU cache and transition to `[IDLE]` before handoff to the Auditor Agent.
