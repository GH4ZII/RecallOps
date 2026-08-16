# RecallOps — Implementation Phases

Build in this order. Each phase should leave the demo runnable before moving on.

**Central requirement:** Memory must visibly change the agent's behavior.

---

## Phase 1 — UI + Demo Flow

**Goal:** Full visual demo with mock data. No backend required.

### Deliverables

- [x] Next.js + TypeScript app scaffold
- [x] `/` — operations dashboard
  - Active / resolved incidents
  - Mean resolution time
  - Memories stored
  - Actions avoided
- [x] `/incidents/[id]` — main demo screen
  - Incident details
  - Animated agent timeline
  - Memory retrieval cards
  - Agent decision + confidence
  - Action results
- [x] `/memory` — agent memory list
- [x] Core components: `IncidentCard`, `AgentTimeline`, `MemoryCard`, `AgentDecision`, `StatusBadge`
- [x] Demo scenarios (Incident #1 → Incident #2) with simulated step-by-step agent states
- [x] Agent state machine reflected in UI:
  `DETECTED → SEARCHING_MEMORY → MEMORY_FOUND → REASONING → ACTION_SELECTED → EXECUTING → EVALUATING → RESOLVED → MEMORY_STORED`

### Demo must show

1. Incident #1: no useful memory → try restart ❌ → clear cache ❌ → increase DB pool ✅ → store memory
2. Incident #2: retrieve similar memory → skip failed actions → choose successful action → resolve faster

### Done when

The full Incident #1 → Incident #2 story plays end-to-end in the UI with mock data.

---

## Phase 2 — CockroachDB

**Goal:** Persistent storage for incidents, actions, and memories.

### Deliverables

- [x] CockroachDB connection (`lib/db/cockroach.ts`)
- [x] Schema (`database/schema.sql`)
  - `services`
  - `incidents`
  - `actions`
  - `memories`
- [x] Save / retrieve incidents
- [x] Save / retrieve actions (PENDING, RUNNING, FAILED, SUCCESS, SKIPPED)
- [x] Save / retrieve memories
- [x] Retrieve incident history for a service

### Done when

Incident #1 writes real rows to CockroachDB, and history can be read back.

---

## Phase 3 — Vector Memory

**Goal:** Semantic search so Incident #2 finds Incident #1.

### Deliverables

- [ ] Embedding generation (`lib/ai/embeddings.ts`)
- [ ] Vector column on incidents / memories
- [ ] Vector similarity search in CockroachDB
- [ ] Similarity scores surfaced in UI (e.g. 96%, 89%, 74%)
- [ ] Wire search into agent flow: `createEmbedding → searchSimilarMemories`

### Done when

Triggering Incident #2 retrieves Incident #1 memory via vector search with visible match scores.

---

## Phase 4 — Bedrock

**Goal:** LLM reasoning over current incident + retrieved memories.

### Deliverables

- [ ] Bedrock client (`lib/ai/bedrock.ts`) — Claude preferred, Nova fallback
- [ ] Reasoning prompt (`lib/ai/prompts.ts`) with incident + memories + past actions/outcomes
- [ ] Structured JSON decision response:

```json
{
  "recommendedAction": "increase_db_connection_pool",
  "confidence": 0.94,
  "reasoning": "A highly similar previous incident..."
}
```

- [ ] Agent uses Bedrock output to select remediation
- [ ] Decision shown in UI (action, confidence, why)

### Done when

Bedrock receives vector-retrieved memories and its decision drives the chosen remediation.

---

## Phase 5 — MCP

**Goal:** Agent inspects structured CockroachDB data via Managed MCP Server.

### Deliverables

- [ ] Connect CockroachDB Managed MCP Server
- [ ] At least one meaningful agent DB interaction via MCP, e.g.:
  - `get_service_history`
  - `get_recent_incidents`
  - `get_previous_actions` / failed / successful
- [ ] UI timeline step: “Inspecting incident history through MCP…”

### Keep separate

| Mechanism     | Role                                      |
|---------------|-------------------------------------------|
| Vector search | Find semantically similar memories        |
| MCP           | Inspect / query structured DB history     |

### Done when

The agent uses MCP for at least one real database lookup during the demo flow.

---

## Phase 6 — Lambda

**Goal:** Run the incident-processing workflow on AWS Lambda.

### Deliverables

- [ ] `lambda/incident-handler.ts`
- [ ] Lambda invoked on new incident
- [ ] Workflow inside Lambda: search CockroachDB → call Bedrock → select action → save result
- [ ] Remediation remains simulated (no real infra changes)

### Done when

Incident processing can run via Lambda (or a clear Lambda path exists alongside the app).

---

## Phase 7 — Polish

**Goal:** Hackathon-ready demo and docs.

### Deliverables

- [ ] Animations and loading states
- [ ] Error handling
- [ ] README
- [ ] Screenshots
- [ ] Architecture diagram
- [ ] Deployment notes / setup
- [ ] Demo data reset (re-run Incident #1 → #2 cleanly)

### Done when

Definition of Done from the project plan is met:

```text
Start demo
→ Trigger Incident #1
→ Agent attempts remediation
→ Successful action discovered
→ Memory stored in CockroachDB
→ Trigger Incident #2
→ Vector search retrieves Incident #1
→ Agent reasons using past experience
→ Previously failed actions are skipped
→ Successful remediation is selected
→ Incident resolves faster
→ New memory is stored
```

---

## Out of scope (all phases)

Do not build:

- Real Kubernetes / CloudWatch remediation
- Auth, billing, multi-user, RBAC
- Mobile app
- Many incident scenarios
- Complex ML anomaly detection

Simulated incidents are fine. Focus on the **memory-driven agent workflow**.

---

## Suggested build order (summary)

| Phase | Focus              | Depends on   |
|-------|--------------------|--------------|
| 1     | UI + mock demo     | —            |
| 2     | CockroachDB CRUD   | Phase 1      |
| 3     | Vector memory      | Phase 2      |
| 4     | Bedrock reasoning  | Phase 3      |
| 5     | MCP                | Phase 2      |
| 6     | Lambda             | Phases 2–4   |
| 7     | Polish             | Phases 1–6   |

Phases 5 and 6 can overlap once 2–4 work. Prefer finishing the demo story (1–4) before deep polish.
