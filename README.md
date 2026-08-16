# RecallOps

**RecallOps** is an AI incident-response agent built for the **CockroachDB × AWS Hackathon**.

The agent learns from previous production incidents, remembers which remediation attempts succeeded or failed, and uses that memory to respond better when similar incidents happen again.

### Core idea

> Every incident makes the agent smarter.

RecallOps uses **CockroachDB as persistent agent memory** to store incidents, actions, outcomes, and semantic memories. When a new incident occurs, the agent retrieves relevant past experiences, reasons about them using **Amazon Bedrock**, and recommends or executes the most effective response.

### Stack

* CockroachDB
* CockroachDB Distributed Vector Indexing
* CockroachDB Managed MCP Server
* Amazon Bedrock
* AWS Lambda
* Next.js

### Run locally

```bash
npm install
cp .env.example .env.local
# Set DATABASE_URL to your CockroachDB connection string
npm run db:init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Demo controls** to run Incident #1, then Incident #2.

When Incident #1 finishes, the app writes the service, incident, actions, and memory to CockroachDB. You can verify with:

```bash
# Health + apply schema
curl http://localhost:3000/api/db

# Service history (after Incident #1)
curl "http://localhost:3000/api/history?service=Payments%20API"

# List persisted incidents / memories
curl http://localhost:3000/api/incidents
curl http://localhost:3000/api/memories
```

Without `DATABASE_URL`, the Phase 1 mock demo still runs; persistence is skipped until the DB is configured.
