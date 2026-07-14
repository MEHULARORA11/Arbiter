import { AgentAdapter, WorkerInput, EvaluatorInput, AgentStreamEvent, TitleInput } from './types';
import { WORKER_SYSTEM_PROMPT, EVALUATOR_SYSTEM_PROMPT, AUTO_TITLE_SYSTEM_PROMPT } from './prompts';
import { makeLineIterator } from './utils';

export const claudeAdapter: AgentAdapter = {
  provider: 'claude',

  async *streamWorker(input: WorkerInput): AsyncGenerator<AgentStreamEvent> {
    const start = Date.now();
    try {
      const messages = [
        ...input.history
          .filter(h => h.content && h.content.trim() !== '')
          .map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: input.userQuery }
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': input.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: input.modelId,
          max_tokens: 4096,
          system: WORKER_SYSTEM_PROMPT,
          messages,
          stream: true
        }),
        signal: input.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield { 
          type: 'error', 
          errorType: response.status === 401 ? 'key_error' : response.status === 429 ? 'rate_limit' : 'error', 
          message: errorText 
        };
        return;
      }

      if (!response.body) {
        yield { type: 'error', errorType: 'error', message: 'No response body' };
        return;
      }

      const reader = response.body.getReader();
      const lineIterator = makeLineIterator(reader);
      let fullText = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let cachedInputTokens = 0;
      let cacheWriteTokens = 0;
      let ttftMs: number | undefined = undefined;
      let currentEvent = '';

      for await (const line of lineIterator) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          try {
            const parsed = JSON.parse(dataStr);
            if (currentEvent === 'message_start' && parsed.message?.usage) {
              inputTokens = parsed.message.usage.input_tokens;
              cachedInputTokens = parsed.message.usage.cache_read_input_tokens || 0;
              cacheWriteTokens = parsed.message.usage.cache_creation_input_tokens || 0;
            } else if (currentEvent === 'content_block_delta' && parsed.delta?.text) {
              const delta = parsed.delta.text;
              if (ttftMs === undefined) {
                ttftMs = Date.now() - start;
              }
              fullText += delta;
              yield { type: 'delta', text: delta };
            } else if (currentEvent === 'message_delta' && parsed.usage) {
              outputTokens = parsed.usage.output_tokens;
            }
          } catch (e) {
            // Ignore partial parse
          }
        }
      }

      if (inputTokens === 0) {
        inputTokens = Math.ceil(JSON.stringify(messages).length / 4);
        outputTokens = Math.ceil(fullText.length / 4);
      }

      yield {
        type: 'done',
        inputTokens,
        outputTokens,
        cachedInputTokens,
        cacheWriteTokens,
        latencyMs: Date.now() - start,
        ttftMs,
        fullText
      };
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      yield { type: 'error', errorType: 'error', message: err.message || 'Network error' };
    }
  },

  async *streamEvaluator(input: EvaluatorInput): AsyncGenerator<AgentStreamEvent> {
    const start = Date.now();
    try {
      const candidatesText = input.workerResults
        .map(r => `[${r.provider.toUpperCase()} (${r.modelId})] (Status: ${r.status})\n${r.text || 'Unavailable'}`)
        .join('\n\n');

      const messages = [
        ...input.history
          .filter(h => h.content && h.content.trim() !== '')
          .map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: `Original Question: ${input.userQuery}\n\nCandidate Answers:\n${candidatesText}` }
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': input.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: input.modelId,
          max_tokens: 4096,
          system: EVALUATOR_SYSTEM_PROMPT,
          messages,
          stream: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield { 
          type: 'error', 
          errorType: response.status === 401 ? 'key_error' : response.status === 429 ? 'rate_limit' : 'error', 
          message: errorText 
        };
        return;
      }

      if (!response.body) {
        yield { type: 'error', errorType: 'error', message: 'No response body' };
        return;
      }

      const reader = response.body.getReader();
      const lineIterator = makeLineIterator(reader);
      let fullText = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let cachedInputTokens = 0;
      let cacheWriteTokens = 0;
      let ttftMs: number | undefined = undefined;
      let currentEvent = '';

      for await (const line of lineIterator) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          try {
            const parsed = JSON.parse(dataStr);
            if (currentEvent === 'message_start' && parsed.message?.usage) {
              inputTokens = parsed.message.usage.input_tokens;
              cachedInputTokens = parsed.message.usage.cache_read_input_tokens || 0;
              cacheWriteTokens = parsed.message.usage.cache_creation_input_tokens || 0;
            } else if (currentEvent === 'content_block_delta' && parsed.delta?.text) {
              const delta = parsed.delta.text;
              if (ttftMs === undefined) {
                ttftMs = Date.now() - start;
              }
              fullText += delta;
              yield { type: 'delta', text: delta };
            } else if (currentEvent === 'message_delta' && parsed.usage) {
              outputTokens = parsed.usage.output_tokens;
            }
          } catch (e) {
            // Ignore
          }
        }
      }

      if (inputTokens === 0) {
        inputTokens = Math.ceil(JSON.stringify(messages).length / 4);
        outputTokens = Math.ceil(fullText.length / 4);
      }

      yield {
        type: 'done',
        inputTokens,
        outputTokens,
        cachedInputTokens,
        cacheWriteTokens,
        latencyMs: Date.now() - start,
        ttftMs,
        fullText
      };
    } catch (err: any) {
      yield { type: 'error', errorType: 'error', message: err.message || 'Network error' };
    }
  },

  async runTitle(input: TitleInput): Promise<string> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': input.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: input.modelId,
          system: AUTO_TITLE_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: input.userQuery }],
          max_tokens: 60,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Title generation failed');
      }

      const data = await response.json();
      return data.content?.[0]?.text?.trim() || 'New Conversation';
    } catch (err) {
      return 'New Conversation';
    }
  }
};
