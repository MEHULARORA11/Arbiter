import { AgentAdapter, WorkerInput, EvaluatorInput, AgentStreamEvent, TitleInput } from './types';
import { WORKER_SYSTEM_PROMPT, EVALUATOR_SYSTEM_PROMPT, AUTO_TITLE_SYSTEM_PROMPT } from './prompts';
import { makeLineIterator } from './utils';

export const deepseekAdapter: AgentAdapter = {
  provider: 'deepseek',

  async *streamWorker(input: WorkerInput): AsyncGenerator<AgentStreamEvent> {
    const start = Date.now();
    try {
      const messages = [
        { role: 'system', content: WORKER_SYSTEM_PROMPT },
        ...input.history
          .filter(h => h.content && h.content.trim() !== '')
          .map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: input.userQuery }
      ];

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${input.apiKey}`
        },
        body: JSON.stringify({
          model: input.modelId,
          messages,
          stream: true,
          stream_options: { include_usage: true }
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
      let ttftMs: number | undefined = undefined;

      for await (const line of lineIterator) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            if (ttftMs === undefined) {
              ttftMs = Date.now() - start;
            }
            fullText += delta;
            yield { type: 'delta', text: delta };
          }
          if (parsed.usage) {
            inputTokens = parsed.usage.prompt_tokens;
            outputTokens = parsed.usage.completion_tokens;
            cachedInputTokens = parsed.usage.prompt_tokens_details?.cached_tokens ?? parsed.usage.prompt_cache_hit_tokens ?? 0;
          }
        } catch (e) {
          // Ignore partial parse
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
        { role: 'system', content: EVALUATOR_SYSTEM_PROMPT },
        ...input.history
          .filter(h => h.content && h.content.trim() !== '')
          .map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: `Original Question: ${input.userQuery}\n\nCandidate Answers:\n${candidatesText}` }
      ];

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${input.apiKey}`
        },
        body: JSON.stringify({
          model: input.modelId,
          messages,
          stream: true,
          stream_options: { include_usage: true }
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
      let ttftMs: number | undefined = undefined;

      for await (const line of lineIterator) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            if (ttftMs === undefined) {
              ttftMs = Date.now() - start;
            }
            fullText += delta;
            yield { type: 'delta', text: delta };
          }
          if (parsed.usage) {
            inputTokens = parsed.usage.prompt_tokens;
            outputTokens = parsed.usage.completion_tokens;
            cachedInputTokens = parsed.usage.prompt_tokens_details?.cached_tokens ?? parsed.usage.prompt_cache_hit_tokens ?? 0;
          }
        } catch (e) {
          // Ignore
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
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${input.apiKey}`
        },
        body: JSON.stringify({
          model: input.modelId,
          messages: [
            { role: 'system', content: AUTO_TITLE_SYSTEM_PROMPT },
            { role: 'user', content: input.userQuery }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Title generation failed');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'New Conversation';
    } catch (err) {
      return 'New Conversation';
    }
  }
};
