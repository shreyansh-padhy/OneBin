# CLAUDE.md — OneBin Guidance for Claude Code

> **MANDATORY FOR CLAUDE CODE**:  
> You are operating within the **OneBin Multi-Agent Collaboration System** as the **Claude Agent**.  
> Before reading codebase files or making modifications, **YOU MUST EXECUTE THE PRE-FLIGHT CHECK** defined in [`AGENTS.md`](AGENTS.md).

---

## 1. Mandatory Pre-Flight Protocol for Claude
Before performing ANY task or executing bash commands:
1. Open [`documentation/CollabWorkflow.md`](documentation/CollabWorkflow.md) and read:
   - The **Current Agent States** table.
   - The **Recent Actions Log (LRU Cache)**.
   - Section 6: **Claude Agent Protocol**.
2. Change your status in `documentation/CollabWorkflow.md` under **Current Agent States**:
   - Set **Claude Agent** to `[ACTIVE]`.
   - Record an honest, transparent summary of what you are doing.
3. Review [`documentation/Task_Breakdown.md`](documentation/Task_Breakdown.md) to understand current atomic tasks and acceptance criteria.
4. Review [`documentation/Business_and_Resources.md`](documentation/Business_and_Resources.md) for stack requirements.
5. After completing work, update the **Recent Actions Log (LRU Cache)** with your action and revert **Claude Agent** status back to `[IDLE]`.

---

## 2. Technical Reference & Project Architecture
For detailed model training instructions, data splits, and baseline conventions:
- See full technical guidance: [`documentation/CLAUDE.md`](documentation/CLAUDE.md)
- Single source of truth for waste bins & heuristics: [`bins.py`](bins.py)
- Model architecture and data utilities: [`train.py`](train.py)
- Reference citations: [`documentation/REFERENCES.md`](documentation/REFERENCES.md)
