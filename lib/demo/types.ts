export type AgentState =
  | "IDLE"
  | "DETECTED"
  | "SEARCHING_MEMORY"
  | "MEMORY_FOUND"
  | "REASONING"
  | "ACTION_SELECTED"
  | "EXECUTING"
  | "EVALUATING"
  | "RESOLVED"
  | "MEMORY_STORED";

export type IncidentStatus = "pending" | "active" | "resolved";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ActionStatus = "PENDING" | "RUNNING" | "FAILED" | "SUCCESS" | "SKIPPED";

export type ScenarioId = "incident-1" | "incident-2";

export interface Incident {
  id: string;
  scenarioId: ScenarioId;
  service: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  latencyMs?: number;
  startedAt: string;
  resolvedAt?: string;
  resolutionSeconds?: number;
}

export interface TimelineEvent {
  id: string;
  at: string;
  label: string;
  state: AgentState;
  tone?: "neutral" | "success" | "danger" | "accent";
}

export interface RetrievedMemory {
  id: string;
  similarity: number;
  service: string;
  summary: string;
  successfulAction: string;
  failedActions: string[];
}

export interface ActionResult {
  id: string;
  actionType: string;
  description: string;
  status: ActionStatus;
}

export interface AgentDecision {
  recommendedAction: string;
  confidence: number;
  reasoning: string;
}

export interface Memory {
  id: string;
  incidentId: string;
  service: string;
  summary: string;
  rootCause: string;
  successfulAction: string;
  failedActions: string[];
  createdAt: string;
}

export interface IncidentRuntime {
  incidentId: string;
  agentState: AgentState;
  timeline: TimelineEvent[];
  retrievedMemories: RetrievedMemory[];
  decision: AgentDecision | null;
  actions: ActionResult[];
  isSimulating: boolean;
}

export interface DashboardMetrics {
  activeCount: number;
  resolvedCount: number;
  meanResolutionSeconds: number | null;
  memoriesStored: number;
  actionsAvoided: number;
}

export interface DemoState {
  incidents: Incident[];
  memories: Memory[];
  runtimes: Record<string, IncidentRuntime>;
  incident1Complete: boolean;
  incident2Complete: boolean;
  actionsAvoided: number;
}
