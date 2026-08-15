# RecallOps — Project Plan

## 1. Project Overview

**RecallOps** is an AI incident-response agent built for the **CockroachDB × AWS Hackathon**.

The core idea:

> **Every incident makes the agent smarter.**

RecallOps stores previous incidents, attempted remediation actions, and their outcomes in CockroachDB. When a similar incident happens again, the agent retrieves relevant past memories, reasons over them using an LLM through Amazon Bedrock, and recommends the action most likely to succeed.

The main demo should clearly show:

1. An incident occurs.
2. The agent has little/no useful memory.
3. It tries multiple actions.
4. One action succeeds.
5. The experience is stored.
6. A similar incident occurs later.
7. RecallOps retrieves the previous memory.
8. It skips previously failed actions.
9. It chooses the successful remediation immediately.
10. The new outcome is stored as another memory.

---

# 2. Main Goal

Build a polished, working hackathon demo where **persistent memory directly improves the agent's future decisions**.

Do not build a generic chatbot.

The product should feel like an autonomous SRE / incident-response system.

---

# 3. Tech Stack

## Frontend

### Next.js + TypeScript

Used for:

* incident dashboard
* active incident view
* live agent activity
* memory retrieval visualization
* remediation actions
* incident history
* success/failure results

---

## Agent Logic

The RecallOps agent orchestrates the workflow.

Basic flow:

```text
Incident detected
      ↓
Analyze incident
      ↓
Search previous memories
      ↓
Retrieve similar incidents
      ↓
Ask AI model for decision
      ↓
Select remediation action
      ↓
Execute/simulate action
      ↓
Evaluate result
      ↓
Store new memory
```

The agent must always follow:

> **Remember → Reason → Act → Learn**

---

# 4. CockroachDB

CockroachDB is the persistent long-term memory layer.

Store:

* incidents
* services
* remediation actions
* action outcomes
* agent decisions
* incident summaries
* vector embeddings
* timestamps

CockroachDB should be essential to the product, not just used as normal app storage.

---

# 5. CockroachDB Distributed Vector Indexing

Use vector embeddings to perform semantic search across historical incidents.

Example:

Current incident:

```text
Checkout API cannot acquire database connections.
```

Previous memory:

```text
Payments API suffered database connection pool exhaustion.
```

Even though the wording differs, vector search should recognize them as similar.

Expected result:

```text
Similar memories

96% - DB connection pool exhaustion
89% - Database max connections reached
74% - API latency caused by database pressure
```

The agent then uses these memories as context for reasoning.

---

# 6. CockroachDB Managed MCP Server

Use CockroachDB MCP as one of the required CockroachDB technologies.

Possible agent use cases:

```text
get_service_history
get_recent_incidents
get_incident_details
get_previous_actions
get_failed_actions
get_successful_actions
```

The agent should use MCP to inspect structured data in CockroachDB.

Keep vector search and MCP conceptually separate:

* **Vector search** → finds semantically similar memories.
* **MCP** → lets the agent inspect/query the database.

---

# 7. Amazon Bedrock

Use Amazon Bedrock to call the LLM.

Preferred model:

* Claude available through Bedrock
* fallback: Amazon Nova

Bedrock receives:

```text
Current incident
+
Retrieved memories
+
Previous actions
+
Previous outcomes
```

Example prompt:

```text
You are an autonomous incident-response agent.

Current incident:
Payments API has high latency and database connection errors.

Relevant previous incident:
A similar incident occurred previously.

Actions attempted:
1. Restart service → FAILED
2. Clear cache → FAILED
3. Increase DB connection pool → SUCCESS

Choose the best next remediation action.

Avoid repeating actions that failed for highly similar incidents unless there is strong evidence they should work now.

Return:
- recommended_action
- reasoning
- confidence
```

---

# 8. AWS Lambda

Use AWS Lambda to process incidents.

Possible flow:

```text
New incident
    ↓
Lambda invoked
    ↓
Run RecallOps workflow
    ↓
Search CockroachDB
    ↓
Call Bedrock
    ↓
Select action
    ↓
Save result
```

For the hackathon demo, remediation can be simulated.

Do not spend time building real production infrastructure remediation.

---

# 9. Database Schema

Start simple.

## services

```text
id
name
environment
created_at
```

## incidents

```text
id
service_id
title
description
severity
status
started_at
resolved_at
embedding
```

## actions

```text
id
incident_id
action_type
description
status
started_at
completed_at
```

Possible action statuses:

```text
PENDING
RUNNING
FAILED
SUCCESS
SKIPPED
```

## memories

```text
id
incident_id
summary
root_cause
successful_action
failed_actions
embedding
created_at
```

---

# 10. Demo Scenario

Use one carefully designed scenario.

## Incident #1

### Problem

```text
Payments API
High latency
Database connection errors
```

Agent finds no useful previous memory.

Agent attempts:

```text
1. Restart service
   ❌ Failed

2. Clear cache
   ❌ Failed

3. Increase DB connection pool
   ✅ Success
```

Store memory:

```text
Payments API suffered high latency caused by database
connection pool exhaustion.

Restarting the service did not resolve the issue.

Clearing cache did not resolve the issue.

Increasing the database connection pool resolved it.
```

---

## Incident #2

Later simulate:

```text
Checkout API
High latency
Cannot acquire database connections
```

Agent searches memory.

UI should show:

```text
Searching long-term memory...

3 memories found

Best match: 96%

Payments API connection pool exhaustion

Previous remediation:
Restart            FAILED
Clear cache         FAILED
Increase DB pool    SUCCESS
```

Agent reasons:

```text
This incident strongly resembles a previous
database connection exhaustion incident.

Restarting and clearing cache failed previously.

Increasing the connection pool successfully resolved
the previous incident.

Recommended action:
Increase DB connection pool.

Confidence: 94%
```

Then:

```text
Executing remediation...

✅ Incident resolved
```

Store new memory.

---

# 11. UI Pages

## `/`

Main operations dashboard.

Show:

```text
Active incidents
Resolved incidents
Mean resolution time
Memories stored
Actions avoided
```

---

## `/incidents/[id]`

Main demo screen.

Layout:

### Incident

```text
Payments API
CRITICAL
Latency: 4200ms
```

### Agent Activity

```text
00:01 Incident detected
00:02 Searching memory
00:03 Found 3 related incidents
00:04 Reasoning with Bedrock
00:05 Selecting remediation
00:06 Executing action
00:08 Incident resolved
00:09 Memory stored
```

### Memory Retrieval

Show cards:

```text
96% match

Payments API
DB connection exhaustion

Successful:
Increase DB pool

Failed:
Restart
Clear cache
```

### Agent Decision

```text
Recommended action:
Increase DB connection pool

Confidence:
94%

Why:
Previous similar incident was solved using this action.
```

---

## `/memory`

Show agent memory.

Example:

```text
Memory #001
Payments API
Connection Pool Exhaustion

Learned:
Restarting did not help.
Increasing DB pool resolved the incident.
```

---

# 12. UI Experience

The dashboard should feel alive.

Avoid immediately showing the final result.

Animate the agent workflow step-by-step:

```text
● Detecting incident...

● Searching CockroachDB memory...

● Generating embedding...

● Vector search complete.

✓ 3 relevant memories found.

● Inspecting incident history through MCP...

● Reasoning with Bedrock...

✓ Remediation selected.

● Executing action...

✓ Incident resolved.

✓ New memory stored.
```

The demo should visually communicate that the agent is actively working.

---

# 13. Agent State Machine

Implement clear states.

```text
DETECTED
↓
SEARCHING_MEMORY
↓
MEMORY_FOUND
↓
REASONING
↓
ACTION_SELECTED
↓
EXECUTING
↓
EVALUATING
↓
RESOLVED
↓
MEMORY_STORED
```

Frontend should react to these states.

---

# 14. Suggested Folder Structure

```text
recallops/
│
├── app/
│   ├── page.tsx
│   ├── incidents/
│   │   └── [id]/
│   │       └── page.tsx
│   └── memory/
│       └── page.tsx
│
├── components/
│   ├── IncidentCard.tsx
│   ├── AgentTimeline.tsx
│   ├── MemoryCard.tsx
│   ├── AgentDecision.tsx
│   └── StatusBadge.tsx
│
├── lib/
│   ├── db/
│   │   ├── cockroach.ts
│   │   ├── incidents.ts
│   │   └── memories.ts
│   │
│   ├── ai/
│   │   ├── bedrock.ts
│   │   ├── embeddings.ts
│   │   └── prompts.ts
│   │
│   ├── agent/
│   │   ├── agent.ts
│   │   ├── memory.ts
│   │   ├── reasoning.ts
│   │   └── actions.ts
│   │
│   └── demo/
│       ├── scenarios.ts
│       └── simulate.ts
│
├── lambda/
│   └── incident-handler.ts
│
├── database/
│   └── schema.sql
│
├── public/
│
├── README.md
├── PROJECT_PLAN.md
└── LICENSE
```

---

# 15. Core Agent Pseudocode

```typescript
async function handleIncident(incident) {
  // 1. Persist incoming incident
  await saveIncident(incident);

  // 2. Convert incident into embedding
  const embedding = await createEmbedding(incident.description);

  // 3. Search CockroachDB vector memory
  const memories = await searchSimilarMemories(embedding);

  // 4. Retrieve structured historical information
  const history = await getRelevantHistory(incident, memories);

  // 5. Ask Bedrock model to reason
  const decision = await reasonWithBedrock({
    incident,
    memories,
    history,
  });

  // 6. Execute or simulate selected remediation
  const result = await executeAction(decision.action);

  // 7. Store action + result
  await saveActionResult({
    incident,
    decision,
    result,
  });

  // 8. Generate new memory
  const memory = await createMemory({
    incident,
    decision,
    result,
  });

  // 9. Store memory + embedding
  await saveMemory(memory);

  return {
    decision,
    result,
    memory,
  };
}
```

---

# 16. MVP Priorities

Build in this order.

## Phase 1 — UI + Demo Flow

Build the full visual demo using mock data first.

Must have:

* dashboard
* incident page
* animated agent timeline
* memory cards
* action results
* working Incident #1 → Incident #2 scenario

Do not wait for backend integrations before building the demo experience.

---

## Phase 2 — CockroachDB

Implement:

* connection
* schema
* save incidents
* save actions
* save memories
* retrieve history

---

## Phase 3 — Vector Memory

Implement:

* embeddings
* vector column
* vector search
* similarity results

Make sure Incident #2 retrieves Incident #1.

---

## Phase 4 — Bedrock

Implement:

* Bedrock connection
* reasoning prompt
* structured JSON response

Expected output:

```json
{
  "recommendedAction": "increase_db_connection_pool",
  "confidence": 0.94,
  "reasoning": "A highly similar previous incident..."
}
```

---

## Phase 5 — MCP

Connect the CockroachDB Managed MCP Server.

Demonstrate at least one meaningful agent database interaction through MCP.

---

## Phase 6 — Lambda

Move or duplicate the incident-processing workflow into AWS Lambda.

---

## Phase 7 — Polish

Improve:

* animations
* loading states
* error handling
* README
* screenshots
* architecture diagram
* deployment
* demo data reset

---

# 17. Things NOT to Build

Avoid scope creep.

Do not build:

* real Kubernetes remediation
* real CloudWatch infrastructure monitoring
* authentication
* billing
* multi-user system
* complex RBAC
* mobile app
* hundreds of incident scenarios
* complicated ML anomaly detection

Simulated incidents are acceptable.

The important innovation is the **memory-driven agent workflow**.

---

# 18. Definition of Done

The project is ready when the following flow works:

```text
Start demo
↓
Trigger Incident #1
↓
Agent attempts remediation
↓
Successful action discovered
↓
Memory stored in CockroachDB
↓
Trigger Incident #2
↓
Vector search retrieves Incident #1
↓
Agent reasons using past experience
↓
Previously failed actions are skipped
↓
Successful remediation is selected
↓
Incident resolves faster
↓
New memory is stored
```

The UI must make this improvement obvious.

---

# 19. Hackathon Message

The project should communicate one simple story:

> Traditional AI agents can reason, but they repeatedly make the same mistakes if they cannot remember what happened before.

RecallOps gives incident-response agents persistent operational memory.

Every incident teaches the system:

* what happened
* what was tried
* what failed
* what worked
* what should be done next time

### Tagline

> **Every incident makes RecallOps smarter.**

### One-line pitch

> **RecallOps is an AI incident-response agent that remembers what worked, what failed, and uses that experience to resolve future incidents faster.**

---

# 20. Cursor Instructions

When implementing this project:

1. Keep the architecture simple.
2. Prefer clean TypeScript.
3. Build reusable components.
4. Never hardcode secrets.
5. Use environment variables for CockroachDB and AWS credentials.
6. Keep simulation logic separate from production integrations.
7. Every important agent step should generate a UI event.
8. Store real incident history in CockroachDB.
9. Vector retrieval must affect the Bedrock prompt.
10. Bedrock's decision must affect the selected remediation.
11. The resulting action and outcome must be written back to CockroachDB.
12. Prioritize the demo experience over unnecessary features.

The central requirement is:

> **Memory must visibly change the agent's behavior.**
