# OneBin: Multi-Agent Collaboration Workflow & State Ledger

## 1. Core System Directive
> **Mandatory Agent Rule**: All agents must operate with **full transparency and honesty at all times**. Every decision made, fault or deficiency discovered, trade-off weighed, and action taken must be explicitly, objectively, and immediately logged without omission, concealment, or artificial inflation of progress.

---

## 2. Agent Roles & Responsibilities

| Agent | Primary Role | Core Responsibilities |
|---|---|---|
| **Idea Agent** | Specification & Phase Architect | Analyzes high-level objectives, decomposes requirements into sequential phases, and authors granular, atomic task specifications with strict acceptance criteria. |
| **Builder Agent** | Implementation Engineer | Reads atomic task specifications from the Idea Agent, follows established architectural patterns, writes concise production-ready code, and documents changes. |
| **Auditor Agent** | Quality & Verification Inspector | Reviews documentation for gaps, inefficiencies, or faulty logic; rigorously cross-examines the Builder Agent's code against **BOTH** the original project requirements and the Idea Agent's atomic tasks; reports verified passes or concrete failures. |

---

## 3. Agent State Machine

### Operational Rules for State Transitions:
1. **Task Pickup**: Immediately before beginning any work, the agent MUST update its state from `[IDLE]` to `[ACTIVE]` and record an honest, transparent description of the exact task being undertaken.
2. **Execution**: The agent performs the specified task while adhering to project constraints and architectural directives.
3. **Task Completion**: Upon finishing (or if halted due to blockers/errors), the agent MUST document the outcome in the **Recent Actions Log** and reset its state back to `[IDLE]`.

### Current Agent States

| Agent | Status | Current Activity / Focus | Last Updated |
|---|---|---|---|
| **Idea Agent** | `[IDLE]` | Awaiting next project phase decomposition | 2026-10-17 |
| **Builder Agent** | `[IDLE]` | Standing by for approved atomic task assignments | 2026-10-17 |
| **Auditor Agent** | `[IDLE]` | Standing by for verification cycle | 2026-10-17 |

---

## 4. Recent Actions Log (LRU Cache)
*Maintains a rolling ledger of the most recent actions across all agents (max 10 entries). Older entries roll off as new ones are prepended, giving the Auditor Agent an immediate, chronological delta of system changes since the previous audit cycle.*

| Index | Timestamp | Agent | Action / Change | Target Files / Scope | Status / Audit Flag |
|---|---|---|---|---|---|
| 01 | 2026-10-17 | System | Initialized documentation architecture (`Business_and_Resources.md`, `CollabWorkflow.md`) | `documentation/` | Pending Auditor Review |
| 02 | — | — | — | — | — |
| 03 | — | — | — | — | — |
| 04 | — | — | — | — | — |
| 05 | — | — | — | — | — |
| 06 | — | — | — | — | — |
| 07 | — | — | — | — | — |
| 08 | — | — | — | — | — |
| 09 | — | — | — | — | — |
| 10 | — | — | — | — | — |

---

## 5. Auditor Verification Protocol
When the **Auditor Agent** transitions to `[ACTIVE]`, it executes the following checklist:
1. **Scope Inspection**: Compare modified files in the LRU against the Idea Agent's atomic task definition.
2. **Requirement Fidelity**: Verify that no features deviate from or exceed the user's explicit scope.
3. **Honesty & Transparency Check**: Ensure all failures, edge cases, or known limitations are documented rather than obscured.
4. **Execution / Test Verification**: Run verification commands or scripts to ensure changes function as intended.
