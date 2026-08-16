export type DbActionStatus =
  | "PENDING"
  | "RUNNING"
  | "FAILED"
  | "SUCCESS"
  | "SKIPPED";

export type DbIncidentStatus = "pending" | "active" | "resolved";

export interface DbService {
  id: string;
  name: string;
  environment: string;
  created_at: Date;
}

export interface DbIncident {
  id: string;
  service_id: string;
  title: string;
  description: string;
  severity: string;
  status: DbIncidentStatus;
  started_at: Date;
  resolved_at: Date | null;
  external_id: string | null;
  /** Titan Embed Text V2 vector literal or null when not yet embedded */
  embedding: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbAction {
  id: string;
  incident_id: string;
  action_type: string;
  description: string;
  status: DbActionStatus;
  started_at: Date;
  completed_at: Date | null;
  external_id: string | null;
  created_at: Date;
}

export interface DbMemory {
  id: string;
  incident_id: string;
  summary: string;
  root_cause: string;
  successful_action: string;
  failed_actions: string[];
  /** Titan Embed Text V2 vector literal or null when not yet embedded */
  embedding: string | null;
  created_at: Date;
}

export interface SimilarMemory extends DbMemory {
  service_name: string;
  /** Cosine similarity in [0, 1] derived from `1 - (embedding <=> query)` */
  similarity: number;
}

export interface IncidentWithService extends DbIncident {
  service_name: string;
  service_environment: string;
}

export interface ServiceHistory {
  service: DbService;
  incidents: Array<
    IncidentWithService & {
      actions: DbAction[];
      memory: DbMemory | null;
    }
  >;
}
