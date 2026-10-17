# OneBin: Multi-Agent Collaboration Workflow & State Ledger

## 1. Core System Directive
> **Mandatory Agent Rule**: All agents must operate with **full transparency and honesty at all times**. Every decision made, fault or deficiency discovered, trade-off weighed, and action taken must be explicitly, objectively, and immediately logged without omission, concealment, or artificial inflation of progress.

---

## 2. Agent Roles & Responsibilities

| Agent | Instance / Chat ID | Primary Role | Core Responsibilities |
|---|---|---|---|
| **Idea Agent** | — | Specification & Phase Architect | Analyzes high-level objectives, decomposes requirements into sequential phases, and authors granular, atomic task specifications with strict acceptance criteria. |
| **Builder Agent** | — | Implementation Engineer | Reads atomic task specifications from the Idea Agent, follows established architectural patterns, writes concise production-ready code, and documents changes. |
| **Auditor Agent** | `cf506aec-8778-4065-af52-8112e7feeff2` | Quality & Verification Inspector | Reviews documentation for gaps, inefficiencies, or faulty logic; rigorously cross-examines the Builder Agent's code against **BOTH** the original project requirements and the Idea Agent's atomic tasks; reports verified passes or concrete failures. |

---

## 3. Agent State Machine

### Operational Rules for State Transitions:
1. **Task Pickup**: Immediately before beginning any work, the agent MUST update its state from `[IDLE]` to `[ACTIVE]` and record an honest, transparent description of the exact task being undertaken.
2. **Execution**: The agent performs the specified task while adhering to project constraints and architectural directives.
3. **Task Completion**: Upon finishing (or if halted due to blockers/errors), the agent MUST document the outcome in the **Recent Actions Log** and reset its state back to `[IDLE]`.

### Current Agent States

| Agent | Status | Current Activity / Focus | Last Updated |
|---|---|---|---|
| **Idea Agent** | `[IDLE]` | Phase 1 atomic task breakdown authored (`Task_Breakdown.md`); standing by for Phase 2 | 2026-10-17 |
| **Builder Agent** | `[IDLE]` | Greenlit to begin Task 1.1 (Scaffolding & Vercel Config) | 2026-10-17 |
| **Auditor Agent** | `[IDLE]` | Audit of Task_Breakdown.md complete; awaiting Task 1.1 implementation | 2026-10-17 |

---

## 4. Recent Actions Log (LRU Cache)
*Maintains a rolling ledger of the most recent actions across all agents (max 10 entries). Older entries roll off as new ones are prepended, giving the Auditor Agent an immediate, chronological delta of system changes since the previous audit cycle.*

| Index | Timestamp | Agent | Action / Change | Target Files / Scope | Status / Audit Flag |
|---|---|---|---|---|---|
| 01 | 2026-10-17 | Auditor (`cf506aec`) | Audited Phase 1 task breakdown: Approved architecture with CI & model pinning addenda | `documentation/Task_Breakdown.md` | Approved with Notes — Builder Greenlit |
| 02 | 2026-10-17 | Idea Agent | Authored Phase 1 atomic task specifications (Tasks 1.1 - 1.5) for Next.js/Vercel + Gemini API | `documentation/Task_Breakdown.md` | Complete & Audited |
| 03 | 2026-10-17 | System | Relocated CLAUDE.md & REFERENCES.md into documentation/ with updated paths | `documentation/` | Verified & Approved |
| 04 | 2026-10-17 | System | Initialized documentation architecture (`Business_and_Resources.md`, `CollabWorkflow.md`) | `documentation/` | Verified & Approved |
| 05 | — | — | — | — | — |
| 06 | — | — | — | — | — |
| 07 | — | — | — | — | — |
| 08 | — | — | — | — | — |
| 09 | — | — | — | — | — |
| 10 | — | — | — | — | — |

---

## 5. Auditor Verification Protocol & Audit Findings

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
