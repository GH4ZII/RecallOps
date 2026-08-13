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
