-- RecallOps Phase 2 + 3 schema (CockroachDB / PostgreSQL-compatible)
-- Phase 3: VECTOR(1024) embeddings for semantic memory search

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name STRING NOT NULL UNIQUE,
  environment STRING NOT NULL DEFAULT 'production',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services (id),
  title STRING NOT NULL,
  description STRING NOT NULL,
  severity STRING NOT NULL,
  status STRING NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  -- Client/demo id (e.g. "inc-1") for idempotent upserts during the demo
  external_id STRING UNIQUE,
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incidents_service_id_idx ON incidents (service_id);
CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents (status);
CREATE INDEX IF NOT EXISTS incidents_started_at_idx ON incidents (started_at DESC);

CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
  action_type STRING NOT NULL,
  description STRING NOT NULL,
  status STRING NOT NULL DEFAULT 'PENDING',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  -- Client/demo id (e.g. "a1-restart") for idempotent upserts
  external_id STRING,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (incident_id, external_id)
);

CREATE INDEX IF NOT EXISTS actions_incident_id_idx ON actions (incident_id);
CREATE INDEX IF NOT EXISTS actions_status_idx ON actions (status);

CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents (id) ON DELETE CASCADE,
  summary STRING NOT NULL,
  root_cause STRING NOT NULL,
  successful_action STRING NOT NULL,
  failed_actions STRING[] NOT NULL DEFAULT '{}',
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (incident_id)
);

CREATE INDEX IF NOT EXISTS memories_incident_id_idx ON memories (incident_id);
CREATE INDEX IF NOT EXISTS memories_created_at_idx ON memories (created_at DESC);

-- Upgrade path for clusters that already ran Phase 2 schema
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS embedding VECTOR(1024);
ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding VECTOR(1024);

-- Cosine distance vector index for memory similarity search (CockroachDB VECTOR INDEX)
CREATE VECTOR INDEX IF NOT EXISTS memories_embedding_cosine_idx
  ON memories (embedding vector_cosine_ops);
