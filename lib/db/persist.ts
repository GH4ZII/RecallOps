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

/**
 * Persist a completed incident demo run: service + incident + actions + memory.
 */
export async function persistIncidentOutcome(input: PersistIncidentOutcomeInput) {
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
          },
          client,
        )
      : null;

    return { service, incident, actions, memory };
  });
}
