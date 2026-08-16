import {
  createEmbedding,
  isEmbeddingsConfigured,
} from "@/lib/ai/embeddings";
import { saveAction } from "./actions";
import { withTransaction } from "./cockroach";
import { saveIncident } from "./incidents";
import { saveMemory } from "./memories";
import { upsertService } from "./services";
import type { DbActionStatus, DbIncidentStatus } from "./types";

export interface PersistIncidentOutcomeInput {
  serviceName: string;
  environment?: string;
  incident: {
    externalId: string;
    title: string;
    description: string;
    severity: string;
    status: DbIncidentStatus;
    startedAt: string;
    resolvedAt?: string | null;
  };
  actions: Array<{
    externalId: string;
    actionType: string;
    description: string;
    status: DbActionStatus;
  }>;
  memory?: {
    summary: string;
    rootCause: string;
    successfulAction: string;
    failedActions: string[];
  } | null;
}

/** Related memories seeded after Incident #1 so Incident #2 can show multiple scores. */
const CORPUS_MEMORIES = [
  {
    externalId: "corpus-orders-pool",
    serviceName: "Orders API",
    title: "Database max connections reached",
    description:
      "Orders API hit database max connections. Request latency spiked under checkout load.",
    summary: "Database max connections reached",
    rootCause: "Connection pool saturated under peak order volume",
    successfulAction: "Scale DB pool",
    failedActions: ["Restart pods"],
  },
  {
    externalId: "corpus-inventory-pressure",
    serviceName: "Inventory API",
    title: "API latency caused by database pressure",
    description:
      "Inventory API latency caused by database pressure. Writers contended on shared connection slots.",
    summary: "API latency caused by database pressure",
    rootCause: "Database write pressure starving connection pool",
    successfulAction: "Throttle writers",
    failedActions: ["Flush cache"],
  },
] as const;

async function embedText(text: string): Promise<number[] | null> {
  if (!isEmbeddingsConfigured()) return null;
  try {
    return await createEmbedding(text);
  } catch (err) {
    console.warn(
      "[RecallOps] Embedding failed; persisting without vector:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

function memoryEmbedText(summary: string, rootCause: string): string {
  return `${summary}\n${rootCause}`;
}

/**
 * Persist a completed incident demo run: service + incident + actions + memory.
 * Generates embeddings when Bedrock is configured.
 * After Incident #1 (inc-1), seeds two related corpus memories for richer vector hits.
 */
export async function persistIncidentOutcome(input: PersistIncidentOutcomeInput) {
  const incidentEmbedText = `${input.incident.title}. ${input.incident.description}`;
  const incidentEmbedding = await embedText(incidentEmbedText);

  let memoryEmbedding: number[] | null = null;
  if (input.memory) {
    memoryEmbedding = await embedText(
      memoryEmbedText(input.memory.summary, input.memory.rootCause),
    );
  }

  const seedCorpus = input.incident.externalId === "inc-1" && Boolean(input.memory);

  const corpusEmbeddings: Array<number[] | null> = [];
  if (seedCorpus) {
    for (const item of CORPUS_MEMORIES) {
      corpusEmbeddings.push(
        await embedText(memoryEmbedText(item.summary, item.rootCause)),
      );
    }
  }

  return withTransaction(async (client) => {
    const service = await upsertService(
      input.serviceName,
      input.environment ?? "production",
      client,
    );

    const incident = await saveIncident(
      {
        serviceId: service.id,
        title: input.incident.title,
        description: input.incident.description,
        severity: input.incident.severity,
        status: input.incident.status,
        startedAt: input.incident.startedAt,
        resolvedAt: input.incident.resolvedAt ?? null,
        externalId: input.incident.externalId,
        embedding: incidentEmbedding,
      },
      client,
    );

    const actions = [];
    for (const action of input.actions) {
      actions.push(
        await saveAction(
          {
            incidentId: incident.id,
            actionType: action.actionType,
            description: action.description,
            status: action.status,
            externalId: action.externalId,
          },
          client,
        ),
      );
    }

    const memory = input.memory
      ? await saveMemory(
          {
            incidentId: incident.id,
            summary: input.memory.summary,
            rootCause: input.memory.rootCause,
            successfulAction: input.memory.successfulAction,
            failedActions: input.memory.failedActions,
            embedding: memoryEmbedding,
          },
          client,
        )
      : null;

    const corpus = [];
    if (seedCorpus) {
      for (let i = 0; i < CORPUS_MEMORIES.length; i++) {
        const item = CORPUS_MEMORIES[i];
        const corpusService = await upsertService(
          item.serviceName,
          "production",
          client,
        );
        const corpusIncident = await saveIncident(
          {
            serviceId: corpusService.id,
            title: item.title,
            description: item.description,
            severity: "HIGH",
            status: "resolved",
            startedAt: input.incident.startedAt,
            resolvedAt: input.incident.resolvedAt ?? new Date().toISOString(),
            externalId: item.externalId,
            embedding: corpusEmbeddings[i],
          },
          client,
        );
        corpus.push(
          await saveMemory(
            {
              incidentId: corpusIncident.id,
              summary: item.summary,
              rootCause: item.rootCause,
              successfulAction: item.successfulAction,
              failedActions: [...item.failedActions],
              embedding: corpusEmbeddings[i],
            },
            client,
          ),
        );
      }
    }

    return { service, incident, actions, memory, corpus };
  });
}
