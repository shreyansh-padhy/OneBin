# OneBin: Agent Directives & Mandatory Pre-Flight Protocol

> **CRITICAL DIRECTIVE FOR ALL AI AGENTS (Idea, Builder, Auditor, Claude)**:  
> This file defines the mandatory execution protocol for the OneBin project. Every AI agent operating in this repository—regardless of interface, client, or chat session—MUST follow this protocol without exception.

---

## 1. The Mandatory Pre-Flight Protocol

Before reading implementation code, modifying files, executing terminal commands, or generating plans, **YOU MUST EXECUTE THE FOLLOWING PRE-FLIGHT SEQUENCE**:

### Step 1: Context & State Discovery
1. **Read [`documentation/CollabWorkflow.md`](documentation/CollabWorkflow.md)**:
   - Check the **Current Agent States** table. Is another agent currently `[ACTIVE]` on your intended task?
   - Read the **Recent Actions Log (LRU Cache)** to understand what has changed since the last cycle.
   - Review recent **Auditor Findings & Directives** for any blockers or required rework.
2. **Read [`documentation/Task_Breakdown.md`](documentation/Task_Breakdown.md)**:
   - Identify the current active Phase and atomic task definitions (acceptance criteria, target files, constraints).
3. **Read [`documentation/Business_and_Resources.md`](documentation/Business_and_Resources.md)**:
   - Ensure your proposed actions strictly adhere to the project scope and tech stack (Gemini API, Next.js / Vercel, GitHub).

### Step 2: State Claiming (`[IDLE]` ➔ `[ACTIVE]`)
- Open `documentation/CollabWorkflow.md`.
- In the **Current Agent States** table, change your agent's status to **`[ACTIVE]`**.
- Update the **Current Activity / Focus** column with an honest, transparent summary of the exact task you are beginning.
- Update the **Last Updated** timestamp.

### Step 3: Execution
- Execute ONLY the scope specified in the Idea Agent's approved atomic task.
- Adhere strictly to existing coding patterns, error handling, and domain rules defined in `bins.py`.

### Step 4: Post-Flight State Reversion & LRU Cache Update (`[ACTIVE]` ➔ `[IDLE]`)
Once work is verified or if blocked:
1. Open `documentation/CollabWorkflow.md`.
2. Update the **Recent Actions Log (LRU Cache)**:
   - Prepend your completed action at Index `01`.
   - Shift existing entries down (maintaining max 10 entries).
   - Honestly record the files touched, summary of change, and verification status.
3. In the **Current Agent States** table, reset your status back to **`[IDLE]`**.
4. Stage, commit, and push your changes to GitHub using conventional commits.

---

## 2. Agent Roster & Operational Boundaries

| Agent | Core Focus | Operational Boundaries |
|---|---|---|
| **Idea Agent** | Specification & Task Architecture | Authors and refines atomic task breakdowns. Does NOT write application code. |
| **Builder Agent** | Application & Infrastructure Implementation | Implements code strictly according to audited atomic tasks. Does NOT change project scope or bypass Auditor directives. |
| **Auditor Agent** | Quality Assurance, Verification & Truth Ledger | Validates code against specs, reviews CI results, flags deficiencies. Does NOT write feature code; acts as final gatekeeper. |
| **Claude Agent** | Paired Development & Interactive CLI Assistant | Interacts via Claude Code / Anthropic interfaces. Must strictly log state in `CollabWorkflow.md` and abide by the LRU cache protocol. |

---

## 3. Core System Directives
1. **Absolute Transparency & Honesty**: Never conceal a failing test, unverified claim, or broken build. All shortcomings must be objectively logged.
2. **No Speculative Code**: Every code change must trace back to an approved atomic task in `documentation/Task_Breakdown.md`.
3. **Shared Source of Truth**: All state is preserved in git-tracked markdown under `documentation/`. Never rely on external uncommitted memory.
