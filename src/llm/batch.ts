/**
 * Anthropic Batch API client for ralph-starter.
 *
 * Submits multiple requests as a batch for 50% cost reduction.
 * Batch requests are processed asynchronously (up to 24 hours).
 */

import Anthropic from '@anthropic-ai/sdk';

export interface BatchRequest {
  /** Unique identifier for this request within the batch */
  customId: string;
  /** System message (project context, specs, etc.) */
  system?: string;
  /** User message (the task prompt) */
  prompt: string;
  /** Model to use */
  model?: string;
  /** Max tokens for the response */
  maxTokens?: number;
}

export interface BatchResult {
  /** The custom_id from the request */
  customId: string;
  /** Whether this individual request succeeded */
  success: boolean;
  /** The response content (if successful) */
  content?: string;
  /** Error message (if failed) */
  error?: string;
  /** Token usage */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface BatchStatus {
  /** The batch ID */
  batchId: string;
  /** Current processing status */
  status: 'in_progress' | 'canceling' | 'ended';
  /** Number of requests in the batch */
  totalRequests: number;
  /** Number of completed requests */
  completedRequests: number;
  /** Number of failed requests */
  failedRequests: number;
  /** When the batch was created */
  createdAt: string;
  /** When the batch finished (if ended) */
  endedAt?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

/**
 * Submit a batch of requests to the Anthropic Batch API.
 * Returns the batch ID for polling.
 */
export async function submitBatch(apiKey: string, requests: BatchRequest[]): Promise<string> {
  const client = new Anthropic({ apiKey });

  const batchRequests = requests.map((req) => ({
    custom_id: req.customId,
    params: {
      model: req.model || DEFAULT_MODEL,
      max_tokens: req.maxTokens || 4096,
      system: req.system || undefined,
      messages: [
        {
          role: 'user' as const,
          content: req.prompt,
        },
      ],
    },
  }));

  const batch = await client.messages.batches.create({
    requests: batchRequests,
  });

  return batch.id;
}

/**
 * Poll a batch for its current status.
 */
export async function getBatchStatus(apiKey: string, batchId: string): Promise<BatchStatus> {
  const client = new Anthropic({ apiKey });
  const batch = await client.messages.batches.retrieve(batchId);

  return {
    batchId: batch.id,
    status: batch.processing_status,
    totalRequests:
      batch.request_counts.processing +
      batch.request_counts.succeeded +
      batch.request_counts.errored +
      batch.request_counts.canceled +
      batch.request_counts.expired,
    completedRequests: batch.request_counts.succeeded,
    failedRequests:
      batch.request_counts.errored + batch.request_counts.canceled + batch.request_counts.expired,
    createdAt: batch.created_at,
    endedAt: batch.ended_at ?? undefined,
  };
}

/**
 * Retrieve results for a completed batch.
 */
export async function getBatchResults(apiKey: string, batchId: string): Promise<BatchResult[]> {
  const client = new Anthropic({ apiKey });
  const results: BatchResult[] = [];

  const decoder = await client.messages.batches.results(batchId);
  for await (const result of decoder) {
    if (result.result.type === 'succeeded') {
      const message = result.result.message;
      const textBlock = message.content.find((block: { type: string }) => block.type === 'text') as
        | { type: 'text'; text: string }
        | undefined;

      results.push({
        customId: result.custom_id,
        success: true,
        content: textBlock?.text,
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        },
      });
    } else {
      let errorMsg = `Request ${result.result.type}`;
      if (result.result.type === 'errored') {
        const errResp = result.result.error;
        errorMsg = `${errResp.type}: ${JSON.stringify(errResp.error)}`;
      }

      results.push({
        customId: result.custom_id,
        success: false,
        error: errorMsg,
      });
    }
  }

  return results;
}

/**
 * Poll a batch until it completes, with exponential backoff.
 * Calls onProgress on each poll for status updates.
 */
export async function waitForBatch(
  apiKey: string,
  batchId: string,
  options?: {
    /** Callback on each poll */
    onProgress?: (status: BatchStatus) => void;
    /** Maximum wait time in ms (default: 24 hours) */
    maxWaitMs?: number;
    /** Initial poll interval in ms (default: 5 seconds) */
    initialIntervalMs?: number;
    /** Maximum poll interval in ms (default: 60 seconds) */
    maxIntervalMs?: number;
  }
): Promise<BatchStatus> {
  const maxWaitMs = options?.maxWaitMs ?? 24 * 60 * 60 * 1000;
  const initialIntervalMs = options?.initialIntervalMs ?? 5000;
  const maxIntervalMs = options?.maxIntervalMs ?? 60000;

  const startTime = Date.now();
  let intervalMs = initialIntervalMs;

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getBatchStatus(apiKey, batchId);
    options?.onProgress?.(status);

    if (status.status === 'ended') {
      return status;
    }

    // Wait with exponential backoff (capped)
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    intervalMs = Math.min(intervalMs * 1.5, maxIntervalMs);
  }

  throw new Error(`Batch ${batchId} did not complete within ${maxWaitMs / 1000}s`);
}
