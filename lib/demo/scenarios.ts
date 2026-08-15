import type {
  ActionResult,
  AgentDecision,
  AgentState,
  Incident,
  Memory,
  RetrievedMemory,
  ScenarioId,
  TimelineEvent,
} from "./types";

export interface ScenarioStep {
  state: AgentState;
  label: string;
  delayMs: number;
  tone?: TimelineEvent["tone"];
  retrievedMemories?: RetrievedMemory[];
  decision?: AgentDecision;
  action?: ActionResult;
  skipActions?: ActionResult[];
  memory?: Omit<Memory, "id" | "incidentId" | "createdAt">;
  resolve?: boolean;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  incident: Omit<Incident, "id" | "startedAt" | "status" | "resolvedAt" | "resolutionSeconds">;
  steps: ScenarioStep[];
}

const INCIDENT_1_MEMORY_SUMMARY =
  "Payments API suffered high latency caused by database connection pool exhaustion. Restarting the service did not resolve the issue. Clearing cache did not resolve the issue. Increasing the database connection pool resolved it.";

export const scenarios: Record<ScenarioId, ScenarioDefinition> = {
  "incident-1": {
    id: "incident-1",
    incident: {
      scenarioId: "incident-1",
      service: "Payments API",
      title: "High latency and database connection errors",
      description:
        "Payments API has high latency and database connection errors. Clients cannot complete transactions.",
      severity: "CRITICAL",
      latencyMs: 4200,
    },
    steps: [
      {
        state: "DETECTED",
        label: "Incident detected",
        delayMs: 700,
        tone: "danger",
      },
      {
        state: "SEARCHING_MEMORY",
        label: "Searching long-term memory…",
        delayMs: 900,
      },
      {
        state: "MEMORY_FOUND",
        label: "No useful previous memory found",
        delayMs: 800,
        retrievedMemories: [],
        tone: "neutral",
      },
      {
        state: "REASONING",
        label: "Reasoning with Bedrock (cold start)…",
        delayMs: 1000,
      },
      {
        state: "ACTION_SELECTED",
        label: "Selected remediation: Restart service",
        delayMs: 700,
        decision: {
          recommendedAction: "restart_service",
          confidence: 0.42,
          reasoning:
            "No prior memory available. Restarting the service is a common first response for elevated latency.",
        },
      },
      {
        state: "EXECUTING",
        label: "Executing: Restart service",
        delayMs: 1100,
        action: {
          id: "a1-restart",
          actionType: "restart_service",
          description: "Restart service",
          status: "RUNNING",
        },
      },
      {
        state: "EVALUATING",
        label: "Restart service → FAILED",
        delayMs: 800,
        tone: "danger",
        action: {
          id: "a1-restart",
          actionType: "restart_service",
          description: "Restart service",
          status: "FAILED",
        },
      },
      {
        state: "ACTION_SELECTED",
        label: "Selected remediation: Clear cache",
        delayMs: 700,
        decision: {
          recommendedAction: "clear_cache",
          confidence: 0.38,
          reasoning: "Restart failed. Trying cache clear as a secondary latency mitigation.",
        },
      },
      {
        state: "EXECUTING",
        label: "Executing: Clear cache",
        delayMs: 1000,
        action: {
          id: "a1-cache",
          actionType: "clear_cache",
          description: "Clear cache",
          status: "RUNNING",
        },
      },
      {
        state: "EVALUATING",
        label: "Clear cache → FAILED",
        delayMs: 800,
        tone: "danger",
        action: {
          id: "a1-cache",
          actionType: "clear_cache",
          description: "Clear cache",
          status: "FAILED",
        },
      },
      {
        state: "ACTION_SELECTED",
        label: "Selected remediation: Increase DB connection pool",
        delayMs: 700,
        decision: {
          recommendedAction: "increase_db_connection_pool",
          confidence: 0.61,
          reasoning:
            "Symptoms point to connection pressure. Increasing the database connection pool may relieve exhaustion.",
        },
      },
      {
        state: "EXECUTING",
        label: "Executing: Increase DB connection pool",
        delayMs: 1100,
        action: {
          id: "a1-pool",
          actionType: "increase_db_connection_pool",
          description: "Increase DB connection pool",
          status: "RUNNING",
        },
      },
      {
        state: "EVALUATING",
        label: "Increase DB connection pool → SUCCESS",
        delayMs: 800,
        tone: "success",
        action: {
          id: "a1-pool",
          actionType: "increase_db_connection_pool",
          description: "Increase DB connection pool",
          status: "SUCCESS",
        },
      },
      {
        state: "RESOLVED",
        label: "Incident resolved",
        delayMs: 700,
        tone: "success",
        resolve: true,
      },
      {
        state: "MEMORY_STORED",
        label: "New memory stored",
        delayMs: 600,
        tone: "accent",
        memory: {
          service: "Payments API",
          summary: INCIDENT_1_MEMORY_SUMMARY,
          rootCause: "Database connection pool exhaustion",
          successfulAction: "Increase DB connection pool",
          failedActions: ["Restart service", "Clear cache"],
        },
      },
    ],
  },
  "incident-2": {
    id: "incident-2",
    incident: {
      scenarioId: "incident-2",
      service: "Checkout API",
      title: "Cannot acquire database connections",
      description:
        "Checkout API has high latency and cannot acquire database connections. Checkout flow is degraded.",
      severity: "CRITICAL",
      latencyMs: 3800,
    },
    steps: [
      {
        state: "DETECTED",
        label: "Incident detected",
        delayMs: 500,
        tone: "danger",
      },
      {
        state: "SEARCHING_MEMORY",
        label: "Searching long-term memory…",
        delayMs: 600,
      },
      {
        state: "MEMORY_FOUND",
        label: "3 memories found — best match 96%",
        delayMs: 700,
        tone: "accent",
        retrievedMemories: [
          {
            id: "rm-1",
            similarity: 0.96,
            service: "Payments API",
            summary: "DB connection pool exhaustion",
            successfulAction: "Increase DB pool",
            failedActions: ["Restart", "Clear cache"],
          },
          {
            id: "rm-2",
            similarity: 0.89,
            service: "Orders API",
            summary: "Database max connections reached",
            successfulAction: "Scale DB pool",
            failedActions: ["Restart pods"],
          },
          {
            id: "rm-3",
            similarity: 0.74,
            service: "Inventory API",
            summary: "API latency caused by database pressure",
            successfulAction: "Throttle writers",
            failedActions: ["Flush cache"],
          },
        ],
      },
      {
        state: "REASONING",
        label: "Reasoning with Bedrock using retrieved memory…",
        delayMs: 700,
      },
      {
        state: "ACTION_SELECTED",
        label: "Selected remediation: Increase DB connection pool",
        delayMs: 500,
        decision: {
          recommendedAction: "increase_db_connection_pool",
          confidence: 0.94,
          reasoning:
            "This incident strongly resembles a previous database connection exhaustion incident. Restarting and clearing cache failed previously. Increasing the connection pool successfully resolved the previous incident.",
        },
        skipActions: [
          {
            id: "a2-restart",
            actionType: "restart_service",
            description: "Restart service",
            status: "SKIPPED",
          },
          {
            id: "a2-cache",
            actionType: "clear_cache",
            description: "Clear cache",
            status: "SKIPPED",
          },
        ],
      },
      {
        state: "EXECUTING",
        label: "Executing: Increase DB connection pool",
        delayMs: 700,
        action: {
          id: "a2-pool",
          actionType: "increase_db_connection_pool",
          description: "Increase DB connection pool",
          status: "RUNNING",
        },
      },
      {
        state: "EVALUATING",
        label: "Increase DB connection pool → SUCCESS",
        delayMs: 500,
        tone: "success",
        action: {
          id: "a2-pool",
          actionType: "increase_db_connection_pool",
          description: "Increase DB connection pool",
          status: "SUCCESS",
        },
      },
      {
        state: "RESOLVED",
        label: "Incident resolved",
        delayMs: 500,
        tone: "success",
        resolve: true,
      },
      {
        state: "MEMORY_STORED",
        label: "New memory stored",
        delayMs: 400,
        tone: "accent",
        memory: {
          service: "Checkout API",
          summary:
            "Checkout API could not acquire database connections. Prior Payments API memory matched at 96%. Failed actions were skipped. Increasing the DB connection pool resolved the incident.",
          rootCause: "Database connection pool exhaustion",
          successfulAction: "Increase DB connection pool",
          failedActions: [],
        },
      },
    ],
  },
};

export function getScenario(id: ScenarioId): ScenarioDefinition {
  return scenarios[id];
}
