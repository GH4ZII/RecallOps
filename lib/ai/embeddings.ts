import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

export const EMBEDDING_DIMENSIONS = 1024;

const DEFAULT_MODEL = "amazon.titan-embed-text-v2:0";

let client: BedrockRuntimeClient | null = null;

function getRegion(): string | undefined {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || undefined;
}

/**
 * True when AWS region is set. Credentials use the default AWS SDK chain
 * (env keys, shared config/profile, or instance role).
 */
export function isEmbeddingsConfigured(): boolean {
  return Boolean(getRegion());
}

function getClient(): BedrockRuntimeClient {
  const region = getRegion();
  if (!region) {
    throw new Error(
      "AWS_REGION (or AWS_DEFAULT_REGION) is required for Bedrock embeddings",
    );
  }
  if (!client) {
    client = new BedrockRuntimeClient({ region });
  }
  return client;
}

function getModelId(): string {
  return process.env.BEDROCK_EMBEDDING_MODEL?.trim() || DEFAULT_MODEL;
}

interface TitanEmbedResponse {
  embedding?: number[];
  embeddingsByType?: { float?: number[] };
  inputTextTokenCount?: number;
}

/**
 * Generate a 1024-dim embedding via Amazon Titan Text Embeddings V2.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Cannot embed empty text");
  }

  const body = JSON.stringify({
    inputText: trimmed,
    dimensions: EMBEDDING_DIMENSIONS,
    normalize: true,
  });

  const response = await getClient().send(
    new InvokeModelCommand({
      modelId: getModelId(),
      contentType: "application/json",
      accept: "application/json",
      body: new TextEncoder().encode(body),
    }),
  );

  const raw = new TextDecoder().decode(response.body);
  const parsed = JSON.parse(raw) as TitanEmbedResponse;
  const embedding = parsed.embedding ?? parsed.embeddingsByType?.float;

  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding length: got ${embedding?.length ?? 0}, expected ${EMBEDDING_DIMENSIONS}`,
    );
  }

  return embedding;
}

/** Format a float array as a CockroachDB / pgvector VECTOR literal. */
export function toVectorLiteral(embedding: number[]): string {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Vector must have ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`,
    );
  }
  return `[${embedding.join(",")}]`;
}
