# RecallOps – Cheat Sheet

* **Next.js** → dashboard/UI som viser incidents, agent actions og memory.
* **RecallOps Agent Logic** → bestemmer rekkefølgen: hent minne → tenk → handle → lagre resultat.
* **CockroachDB** → permanent langtidsminne for incidents, actions og outcomes.
* **Distributed Vector Indexing** → finner gamle incidents som ligner på det nye problemet.
* **CockroachDB MCP Server** → lar agenten snakke med og hente data fra CockroachDB.
* **Amazon Bedrock** → AWS-tjenesten som gir tilgang til AI-modellen.
* **Claude / Nova** → analyserer incident + tidligere minner og foreslår beste handling.
* **AWS Lambda** → kjører agent-workflowen når et nytt incident kommer.

### Hele flowen

**Incident → Memory search → AI reasoning → Action → Result → Store new memory**

> **CockroachDB husker. Vector search finner. Bedrock/Claude tenker. Agenten handler.**
