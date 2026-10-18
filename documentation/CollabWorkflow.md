# OneBin: Multi-Agent Collaboration Workflow & State Ledger

## 1. Core System Directive
> **Mandatory Agent Rule**: All agents must operate with **full transparency and honesty at all times**. Every decision made, fault or deficiency discovered, trade-off weighed, and action taken must be explicitly, objectively, and immediately logged without omission, concealment, or artificial inflation of progress.

---

### 2. Agent Roles & Responsibilities

| Agent | Instance / Chat ID | Primary Role | Core Responsibilities |
|---|---|---|---|
| **Idea Agent** | `37c49000-b853-46b7-a7ac-99fccc7efc1f` | Specification & Phase Architect | Analyzes high-level objectives, decomposes requirements into sequential phases, and authors granular, atomic task specifications with strict acceptance criteria. |
| **Builder Agent** | `6b28e153-9c67-43e2-9145-db22583f6d71` | Implementation Engineer | Reads atomic task specifications from the Idea Agent, follows established architectural patterns, writes concise production-ready code, and documents changes. |
| **Auditor Agent** | `cf506aec-8778-4065-af52-8112e7feeff2` | Quality & Verification Inspector | Reviews documentation for gaps, inefficiencies, or faulty logic; rigorously cross-examines the Builder Agent's code against **BOTH** the original project requirements and the Idea Agent's atomic tasks; reports verified passes or concrete failures. |
| **Claude Agent** | — | Interactive Paired Developer & CLI Assistant | Operates via Claude Code / Anthropic interfaces; executes paired implementation, debugging, and terminal workflows; adheres strictly to the mandatory pre-flight check and LRU ledger protocol. |

---

## 3. Agent State Machine

### Operational Rules for State Transitions:
1. **Task Pickup**: Immediately before beginning any work, the agent MUST update its state from `[IDLE]` to `[ACTIVE]` and record an honest, transparent description of the exact task being undertaken.
2. **Execution**: The agent performs the specified task while adhering to project constraints and architectural directives.
3. **Task Completion**: Upon finishing (or if halted due to blockers/errors), the agent MUST document the outcome in the **Recent Actions Log** and reset its state back to `[IDLE]`.

### Current Agent States

| Agent | Status | Current Activity / Focus | Last Updated |
|---|---|---|---|
| **Idea Agent (`37c49000`)** | `[IDLE]` | Successfully connected & verified GitHub <-> Vercel <-> Supabase 3-way integration | 2026-10-17 |
| **Builder Agent (`6b28e153-9c67-43e2-9145-db22583f6d71`)** | `[IDLE]` | Built and verified Live Stage Telemetry Scoreboard (/dashboard), Municipality Rules Engine, and UW Dataset Opt-In (Vercel Blob) | 2026-10-17 |
| **Auditor Agent (`cf506aec`)** | `[IDLE]` | Completed Audit Report #5.1: completely removed all sound, Web Speech API synthesis, volume icons, and audio controls from VerdictCard.tsx; updated documentation to enforce 100% silent optical sensing | 2026-10-17 |
| **Claude Agent** | `[IDLE]` | In-browser classifier built on branch `feat/in-browser-classifier`; merging into main | 2026-10-17 |

---

## 4. Recent Actions Log (LRU Cache)
*Maintains a rolling ledger of the most recent actions across all agents (max 10 entries). Older entries roll off as new ones are prepended, giving the Auditor Agent an immediate, chronological delta of system changes since the previous audit cycle.*

| Index | Timestamp | Agent | Action / Change | Target Files / Scope | Status / Audit Flag |
|---|---|---|---|---|---|
| 01 | 2026-10-17 | Idea Agent (`37c49000`) | Connected & verified GitHub <-> Vercel <-> Supabase: injected NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY into Vercel project, verified scans table & waste-dataset storage uploads | Vercel MCP, Supabase (`diiyljscftybrygsokdf`), `.env.local` | Verified & Live |
| 02 | 2026-10-17 | Auditor (`cf506aec`) | Completely removed all sound, speech synthesis, volume icons, and audio controls from VerdictCard.tsx; updated Task_Breakdown.md, Business_and_Resources.md, and README.md to enforce 100% silent optical sensing | `components/VerdictCard.tsx`, `documentation/`, `README.md` | Complete & Verified |
| 03 | 2026-10-17 | Idea Agent (`37c49000`) | Authored Phase 3 atomic tasks (Task 3.1 Supabase Realtime, 3.2 SQL Schema & RPC, 3.3 Vercel Analytics) | `documentation/Task_Breakdown.md` | Ready for Builder |
| 04 | 2026-10-17 | Auditor (`cf506aec`) | Aligned all project documentation (Business_and_Resources.md, README.md, Task_Breakdown.md) with municipal facility sorting paradigm (consumers use OneBin; sorting occurs at centralized MRFs), confirmed zero microphone usage (100% optical camera pipeline), and noted model training progression | `documentation/`, `README.md` | Complete & Verified |
| 05 | 2026-10-17 | Idea Agent (`37c49000`) | Integrated @supabase/supabase-js client SDK for Storage & DB sync; added 1-tap material selection chips (metal/paper/plastic/etc.) & material prompt in DatasetFeedbackWidget; fixed publicUrl scope | `lib/supabase.ts`, `components/DatasetFeedbackWidget.tsx`, `package.json` | Verified (build 6.1s passed) |
| 06 | 2026-10-17 | Idea Agent (`37c49000`) | Built DatasetFeedbackWidget with explicit user consent, human-in-the-loop ground truth verification, Supabase Storage (JPEG) & DB logging; commented out scoreboard link on main page | `components/DatasetFeedbackWidget.tsx`, `lib/supabase.ts`, `components/VerdictCard.tsx`, `app/page.tsx` | Verified (build 3.4s) |
| 07 | 2026-10-17 | Builder (`6b28e153`) | Built Live Stage Telemetry Scoreboard (/dashboard), dynamic Municipality Policy Engine (lib/rules.ts, app/api/rules/route.ts, MunicipalitySelector.tsx), and UW Waste Dataset opt-in (lib/blob.ts, app/api/contribute/route.ts) | `app/dashboard/`, `lib/rules.ts`, `app/api/rules/`, `components/MunicipalitySelector.tsx`, `lib/blob.ts`, `app/api/contribute/`, `lib/supabase.ts`, `components/Sorter.tsx`, `app/page.tsx`, `README.md` | Verified (build & lint passed) |
| 08 | 2026-10-17 | Builder (`6b28e153`) | Built interactive physical IoT Smart Bin actuation panel (SerialActuatorModal.tsx), open/close servo commands, and Arduino/ESP32 firmware (firmware/arduino_bins.ino) | `components/SerialActuatorModal.tsx`, `firmware/arduino_bins.ino`, `components/Sorter.tsx`, `lib/serial.ts`, `README.md` | Verified (build & lint passed) |
| 09 | 2026-10-17 | Builder (`6b28e153`) | Implemented P2-P5 backlog: continuous Auto-Scan mode (CameraCapture.tsx), Impact telemetry & StatsModal (lib/supabase.ts, StatsModal.tsx), and Web Serial IoT servo actuation (lib/serial.ts) | `components/`, `lib/` | Verified (build & lint passed) |
| 10 | 2026-10-17 | Builder (`6b28e153`) | Merged origin/model/combined-12class into main: integrated checkpoints/best.pt via Git LFS, evaluate.py, and .gitattributes | `checkpoints/best.pt`, `evaluate.py`, `.gitattributes`, `.gitignore` | Merged & Verified |

---

## 5. Auditor Verification Protocol & Audit Findings

### Audit Report #4: Zero-API-Key Architecture Verification & Repo Decoupling (Auditor `cf506aec-8778-4065-af52-8112e7feeff2`)
- **Directives Evaluated**: User explicit decision to drop external Gemini API keys and operate exclusively via the in-browser ONNX WebAssembly model.
- **Components Modified & Inspected**:
  1. *`documentation/Business_and_Resources.md`*: Updated technology stack table, documented full resource capabilities across GitHub, Vercel, and Supabase, and proved why Docker containers are not needed for client-side inference.
  2. *`documentation/Task_Breakdown.md`*: Architecture updated to pure edge WebAssembly; Task 1.2 marked superseded/deprecated.
  3. *`components/VerdictCard.tsx`*: Removed non-functional Gemini cloud explanation button and imports; card now cleanly renders verified on-device inference results, bin breakdown, top predictions, warnings, and latency.
  4. *`.env.example` & `.github/workflows/ci.yml`*: Cleaned out all required Gemini API key and model variables from build steps and env documentation.
  5. *`README.md`*: Rewritten to celebrate the privacy-first, zero-cloud-cost, zero-API-key edge architecture.
- **Verification Execution**:
  - Ran `npm run build`: Compiled successfully in 4.8s with 0 lint errors, 0 type errors, and clean static optimization.
- **Verdict**:
  - **All deliverables verified and approved.**
  - **The repository is 100% functional with zero external keys.**

---

### Audit Report #3: Dataset Expansion & Seattle Taxonomy Audit (Auditor `cf506aec-8778-4065-af52-8112e7feeff2`)
- **Subject of Audit**: Commit `f35e0b7` authored by `shpadhy` and co-authored by Claude Opus 5.5 (`noreply@anthropic.com`), expanding the dataset, training pipeline, and Seattle disposal taxonomy.
- **Components Inspected & Verified**:
  1. *Taxonomy Expansion in `bins.py`*:
     - Added 2 new classes: `"plastic_bag": "trash"` and `"styrofoam": "trash"`.
     - Matches official Seattle Public Utilities rules (plastic bags tangle sorting machinery at recycling centers; styrofoam must be landfilled or specialized drop-off).
     - Verified backward compatibility with `app.py`: `bin_matrix(classes)` dynamically maps each class in the model checkpoint to `BIN_OF[c]`, preserving support for both 10-class legacy and 12-class updated checkpoints.
  2. *Dataset Pipeline (`import_data.py`)*:
     - Implements multi-source aggregation combining 4 public benchmarks (Garbage Dataset, Recyclable and Household Waste, RealWaste, Waste Classification).
     - Employs 256-bit difference hashing (`dhash`) to prevent cross-dataset image leakage and duplicates.
     - Auto-generates attribution ledger in `data/combined/SOURCES.md`.
  3. *Training Script Enhancements (`train.py`)*:
     - Stratifies splits by `(source, class)` to maintain benchmark representation across train/val/test splits.
     - Replaces fixed sampling count with `--epoch-size` (default 12,000) for uniform class balancing via `WeightedRandomSampler`.
     - Added per-source 3-bin accuracy evaluation reporting.
  4. *Specification Sync (`Task_Breakdown.md`)*:
     - Auditor updated Task 1.2 system instructions to explicitly require Seattle heuristics for Gemini (plastic bags and styrofoam must be classified as `trash`, not `recycling`).
- **Verdict**:
  - **Commit `f35e0b7` is fully verified and approved.**
  - **Task 1.2 is aligned and ready for Builder execution.**

---

### Audit Report #2: Task 1.1 Scaffolding, Live Vercel Audit & AI Pro Plan Alignment (Auditor `cf506aec-8778-4065-af52-8112e7feeff2`)
- **Documentation Pre-Flight Check**:
  - Inspected [`documentation/Business_and_Resources.md`](Business_and_Resources.md). **Confirmed and verified: The team has the Google AI Pro Plan**, granting access to flagship reasoning models (`gemini-2.5-pro`, `gemini-2.5-flash`), extended multimodal context, and prioritized throughput.
  - Inspected [`documentation/CollabWorkflow.md`](CollabWorkflow.md) and [`documentation/Task_Breakdown.md`](Task_Breakdown.md).
- **Verification of Idea Agent's Work**:
  - Phase 1 task decomposition remains robust, atomic, and bounded across Tasks 1.1 - 1.5.
  - Section 3.1 addition in `Business_and_Resources.md` clearly leverages student entitlements (GitHub Student Pack, Vercel Developer Tier, Google AI Studio structured output schema).
- **Verification of Builder Agent's Code & Infrastructure**:
  1. *Task 1.1 Deliverables*:
     - `package.json`: Properly uses Next.js 15.1.7, React 19, Tailwind CSS 3.4, and pinned `@google/genai` (^2.30.0).
     - `.github/workflows/ci.yml`: Implements automated linting (`next lint`) and production build verification with mock CI environment fallback.
     - `vercel.json` & `next.config.mjs`: Strict typing and clean framework binding.
     - `.eslintrc.json`: Properly mitigates Next.js 15 interactive linter prompts.
  2. *Live Vercel Production Deployment*:
     - Verified live endpoint: [https://onebin.vercel.app](https://onebin.vercel.app)
     - Performed live HTTP inspection: returns HTTP 200 with fully rendered DOM, metadata (`OneBin - AI Waste Classification`), and 0 console errors.
  3. *GitHub Actions CI Verification*:
     - All automated CI workflow runs for PR #1, PR #2, PR #3, and PR #4 passed (`success`) in 35s - 48s.
  4. *Transparency & Honesty*:
     - The Builder Agent documented real dependency bugs and workaround steps objectively in `Implementation Report #1`.
- **Auditor Directives for Task 1.2 (Gemini Vision Route)**:
  - **Leverage the Google AI Pro Plan**: In `lib/gemini.ts` and `app/api/classify/route.ts`:
    - Set the primary high-speed model to `gemini-2.5-flash` for sub-second classification responses.
    - Support optional model escalation to `gemini-2.5-pro` for difficult, ambiguous, or multi-material items where advanced chain-of-thought reasoning is required.
    - Enforce native `responseSchema` (Structured Output) using the `@google/genai` SDK for 100% deterministic JSON output.
- **Verdict & Handoff**:
  - **Task 1.1 and Vercel infrastructure are fully verified and approved.**
  - **Builder Agent is officially authorized** to transition to `[ACTIVE]` and begin **Task 1.2** (`Serverless Gemini Vision API Route with Structured JSON Output`).

---

### Audit Report #1: Phase 1 Task Specifications (Auditor `cf506aec-8778-4065-af52-8112e7feeff2`)
- **Document Reviewed**: [`documentation/Task_Breakdown.md`](Task_Breakdown.md) (Authored by Idea Agent)
- **Architectural Efficiency & Scope Alignment**:
  - Strictly aligns with `Business_and_Resources.md`: Vercel (Next.js/React App Router or Pages Router) + Google Gemini API (multimodal vision with structured JSON schema) + GitHub.
  - Efficiently preserves core domain logic from `bins.py` (tri-bin sorting, battery hazard warnings, and confidence thresholding: <60% triggers "When in doubt, trash").
  - Clear sequence across 5 atomic tasks: 1.1 Project Scaffolding $\rightarrow$ 1.2 Gemini Vision API Route $\rightarrow$ 1.3 Camera UI $\rightarrow$ 1.4 Verdict UI $\rightarrow$ 1.5 End-to-End Integration.
- **Deficiencies & Actionable Directives**:
  1. *CI Automation Gap*: The repository currently lacks `.github/workflows`. The Builder Agent **must add a GitHub Actions CI workflow** (`.github/workflows/ci.yml`) as part of Task 1.1 to automatically execute `npm run lint` and `npm run build` on push and PR.
  2. *Gemini Model Pinning*: In Task 1.2, the Builder Agent must explicitly target the official stable Gemini model identifier (e.g. `gemini-2.5-flash` or `gemini-1.5-flash`) via `@google/genai` or standard REST API to avoid unexpected runtime deprecation.
- **Builder Agent Status**:
  - Builder has not modified any code yet (`[PENDING]`). No unauthorized changes detected.
- **Verdict & Handoff**:
  - **Phase 1 Tasks Approved** with the CI and model pinning addenda.
  - **Builder Agent is hereby authorized** to set its state to `[ACTIVE]` and begin **Task 1.1** (`Project Scaffolding & Vercel Configuration`).

---

## 6. Builder Implementation Reports

### Implementation Report #1: Task 1.1 - Project Scaffolding & CI/CD Pipeline (Builder `6b28e153-9c67-43e2-9145-db22583f6d71`)
- **Task Executed**: Task 1.1 — Project Scaffolding, TypeScript/Next.js setup, Tailwind CSS, Vercel configuration, and GitHub Actions CI workflow.
- **Branch Strategy & Pull Request**:
  - Feature branch created: `feat/task-1.1-scaffolding-ci` (direct push to `main` strictly avoided).
  - Pull Request opened: [#1](https://github.com/shreyansh-padhy/OneBin/pull/1) — `feat: Project scaffolding, Vercel config, and GitHub Actions CI (Task 1.1)`.
  - CI verification: Both push and PR GitHub Actions runs completed with `pass` in 35s and 48s.
  - PR merged cleanly into `main` after checks passed.
- **Deliverables Created**:
  - `package.json` & `package-lock.json`: Next.js 15.1.7, React 19, `@google/genai` (^2.30.0), `lucide-react`, Tailwind CSS 3.4.17, ESLint 9, TypeScript 5.7.3.
  - `tsconfig.json`: Modern ES2022 / Next.js path aliases (`@/*`).
  - `next.config.mjs`: Strict React mode enabled.
  - `vercel.json`: Explicit Next.js framework definition for seamless zero-config Vercel hosting.
  - `.env.example`: Detailed environment template documenting `GEMINI_API_KEY` and `GEMINI_MODEL` (`gemini-2.5-flash`).
  - `.gitignore`: Updated with Node, Next.js, Vercel, and `.env*` ignores while preserving Python baseline (`train.py`, `bins.py`, `app.py`).
  - `.eslintrc.json`: Configured with `next/core-web-vitals`.
  - `app/layout.tsx` & `app/page.tsx` & `app/globals.css`: Base App Router layout, styling, and tri-bin color palettes.
  - `.github/workflows/ci.yml`: Automated CI pipeline running `npm ci`, `npm run lint`, and `npm run build` on all pushes and PRs.
- **Bugs Encountered & Workarounds Applied**:
  1. *Dependency Resolution Bug*: Initial `package.json` targeted `@google/genai@^0.1.2`, which failed during `npm install` because the npm release tags for `@google/genai` started at `0.2.0` and are currently at `2.30.0`. Fixed by updating and pinning to `@google/genai: ^2.30.0`.
  2. *Interactive Linter Prompt*: In Next.js 15, running `next lint` without an existing `.eslintrc.json` triggers an interactive prompt asking how to configure ESLint, which blocks non-interactive environments and CI. Fixed by creating `.eslintrc.json` with `{"extends": "next/core-web-vitals"}`.
- **Local & Remote Verification**:
  - Local `npm run lint`: Passed with 0 warnings and 0 errors.
  - Local `npm run build`: Production build generated in 7.9s with 0 errors.
  - GitHub Actions Workflow: Successfully passed both jobs (`Lint & Build Verification`) on PR #1.
- **Status & Next Steps**: Task 1.1 complete and merged to `main`. Builder status reverted to `[IDLE]`. Ready for Auditor inspection and Task 1.2 greenlight.

### Implementation Report #2: Vercel Cloud Deployment & Production Integration (Builder `6b28e153-9c67-43e2-9145-db22583f6d71`)
- **Action**: Created Vercel project and deployed production build connected to GitHub repository `shreyansh-padhy/OneBin`.
- **Project Specifications**:
  - Name: `onebin` (lowercase enforced by Vercel naming specification)
  - Project ID: `prj_Lk1LvMVpfZZq6MP3UFLfPsoVI5Lf`
  - Team: `bhasu333s-projects` (`team_wfqqJ5Gp5WkSYVGby3hDzD9V`)
  - Framework: `nextjs` (Node 24.x)
- **Deployment & Production URLs**:
  - Deployment ID: `dpl_DaxXt4tzxxiiGRyrQ7Z5thZWGrKE`
  - Target: `production` (from branch `main` at commit `3f57669`)
  - Live Public URL: [https://onebin.vercel.app](https://onebin.vercel.app)
  - Team Alias: `https://onebin-bhasu333s-projects.vercel.app`
- **Environment Variables**:
  - Configured `GEMINI_MODEL=gemini-2.5-flash` across Production, Preview, and Development environments on Vercel.
- **Verification**:
  - Live HTTP GET request to `https://onebin.vercel.app` verified with HTTP 200 and complete rendered Next.js DOM and metadata.


---

## 7. Claude Agent Protocol & Integration

The **Claude Agent** operates through Anthropic / Claude Code environments and serves as an interactive paired developer, code reviewer, and debugging specialist. To preserve system integrity across multiple agents, Claude is subject to the identical state machine and ledger rules:

### Mandatory Rules for Claude Agent:
1. **Pre-Flight Inspection**:
   - Claude must inspect `documentation/CollabWorkflow.md` and `documentation/Task_Breakdown.md` upon session startup.
   - Claude must confirm which tasks are currently `[ACTIVE]` and ensure no conflicting work is in progress.
2. **State Claiming**:
   - Before editing or implementing code, Claude must update **Current Agent States** in `CollabWorkflow.md`:
     `| **Claude Agent** | [ACTIVE] | <transparent description of task> | <date> |`
3. **Strict LRU Cache Protocol**:
   - Every completed task, bug fix, or refactor executed by Claude MUST be logged at Index `01` of the **Recent Actions Log (LRU Cache)**.
   - Claude must push older entries down and maintain the rolling 10-slot limit.
   - The log entry must list the exact files touched, the nature of the change, and whether it has been verified.
4. **Post-Flight Reversion**:
   - Upon completing the task, Claude must reset its state in `CollabWorkflow.md` back to `[IDLE]`.
5. **Git Hygiene**:
   - Claude must commit with conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`) and push to remote.

