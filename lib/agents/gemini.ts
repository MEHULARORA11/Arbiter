import { AgentAdapter, WorkerInput, EvaluatorInput, AgentStreamEvent, TitleInput } from './types';
import { WORKER_SYSTEM_PROMPT, EVALUATOR_SYSTEM_PROMPT, AUTO_TITLE_SYSTEM_PROMPT } from './prompts';
import { makeLineIterator } from './utils';

export const geminiAdapter: AgentAdapter = {
  provider: 'gemini',

  async *streamWorker(input: WorkerInput): AsyncGenerator<AgentStreamEvent> {
    const start = Date.now();
    try {
      const contents = [
        ...input.history
          .filter(h => h.content && h.content.trim() !== '')
          .map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          })),
        {
          role: 'user',
          parts: [{ text: input.userQuery }]
        }
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.modelId}:streamGenerateContent?alt=sse&key=${input.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: WORKER_SYSTEM_PROMPT }]
          }
        }),
        signal: input.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        const isKeyError = response.status === 400 && (errorText.includes('API_KEY_INVALID') || errorText.includes('INVALID_ARGUMENT')) 
          || response.status === 403;
        yield { 
          type: 'error', 
          errorType: isKeyError ? 'key_error' : response.status === 429 ? 'rate_limit' : 'error', 
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
      let ttftMs: number | undefined = undefined;

      for await (const line of lineIterator) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (delta) {
            if (ttftMs === undefined) {
              ttftMs = Date.now() - start;
            }
            fullText += delta;
            yield { type: 'delta', text: delta };
          }
          if (parsed.usageMetadata) {
            inputTokens = parsed.usageMetadata.promptTokenCount;
            outputTokens = parsed.usageMetadata.candidatesTokenCount;
          }
        } catch (e) {
          // Ignore partial parsing errors
        }
      }

      if (inputTokens === 0) {
        inputTokens = Math.ceil(JSON.stringify(contents).length / 4);
        outputTokens = Math.ceil(fullText.length / 4);
      }

      yield {
        type: 'done',
        inputTokens,
        outputTokens,
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

      const contents = [
        ...input.history
          .filter(h => h.content && h.content.trim() !== '')
          .map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          })),
        {
          role: 'user',
          parts: [{ text: `Original Question: ${input.userQuery}\n\nCandidate Answers:\n${candidatesText}` }]
        }
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.modelId}:streamGenerateContent?alt=sse&key=${input.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: EVALUATOR_SYSTEM_PROMPT }]
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const isKeyError = response.status === 400 && (errorText.includes('API_KEY_INVALID') || errorText.includes('INVALID_ARGUMENT'))
          || response.status === 403;
        yield { 
          type: 'error', 
          errorType: isKeyError ? 'key_error' : response.status === 429 ? 'rate_limit' : 'error', 
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
      let ttftMs: number | undefined = undefined;

      for await (const line of lineIterator) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();

        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (delta) {
            if (ttftMs === undefined) {
              ttftMs = Date.now() - start;
            }
            fullText += delta;
            yield { type: 'delta', text: delta };
          }
          if (parsed.usageMetadata) {
            inputTokens = parsed.usageMetadata.promptTokenCount;
            outputTokens = parsed.usageMetadata.candidatesTokenCount;
          }
        } catch (e) {
          // Ignore
        }
      }

      if (inputTokens === 0) {
        inputTokens = Math.ceil(JSON.stringify(contents).length / 4);
        outputTokens = Math.ceil(fullText.length / 4);
      }

      yield {
        type: 'done',
        inputTokens,
        outputTokens,
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
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.modelId}:generateContent?key=${input.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: input.userQuery }]
          }],
          systemInstruction: {
            parts: [{ text: AUTO_TITLE_SYSTEM_PROMPT }]
          },
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error('Title generation failed');
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'New Conversation';
    } catch (err) {
      return 'New Conversation';
    }
  }
};
