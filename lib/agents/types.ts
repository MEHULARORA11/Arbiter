export interface AgentAdapter {
  provider: 'openai' | 'claude' | 'gemini' | 'deepseek' | 'mistral';
  streamWorker(input: WorkerInput): AsyncGenerator<AgentStreamEvent>;
  streamEvaluator(input: EvaluatorInput): AsyncGenerator<AgentStreamEvent>;
  runTitle(input: TitleInput): Promise<string>;
}

export interface WorkerInput {
  apiKey: string;
  modelId: string;
  userQuery: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
}

export type AgentStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; inputTokens: number; outputTokens: number; cachedInputTokens?: number; cacheWriteTokens?: number; latencyMs: number; ttftMs?: number; fullText: string }
  | { type: 'error'; errorType: 'key_error' | 'rate_limit' | 'timeout' | 'error'; message: string };

export interface EvaluatorInput {
  apiKey: string;
  modelId: string;
  userQuery: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  workerResults: { provider: string; modelId: string; text: string; status: string }[];
}

export interface EvaluatorResult {
  synthesizedText: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface TitleInput {
  apiKey: string;
  modelId: string;
  userQuery: string;
}
