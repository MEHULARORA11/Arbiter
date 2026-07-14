import { getAgentAdapter } from '@/lib/agents/registry';

interface RunPipelineOptions {
  content: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  selectedWorkers: string[];
  selectedEvaluator: string | null;
  modelSelections: Record<string, string>;
  apiKeys: Record<string, string>;
  signal: AbortSignal;
  sendEvent: (event: string, data: any) => void;
}

export async function runPipeline({
  content,
  history,
  selectedWorkers,
  selectedEvaluator,
  modelSelections,
  apiKeys,
  signal,
  sendEvent,
}: RunPipelineOptions) {
  const runsToPersist: any[] = [];

  // 1. Fan out workers concurrently
  const runWorker = async (provider: string, modelId: string) => {
    const apiKey = apiKeys[provider];
    if (!apiKey) {
      const msg = 'API Key not configured.';
      sendEvent('worker_error', { provider, modelId, errorType: 'key_error', message: msg });
      runsToPersist.push({
        provider,
        modelId,
        role: 'worker',
        status: 'key_error',
        inputTokens: 0,
        cachedTokens: 0,
        cacheWriteTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        ttftMs: null,
        errorMessage: msg,
      });
      return { provider, modelId, status: 'key_error', text: '' };
    }

    sendEvent('worker_start', { provider, modelId });

    try {
      const adapter = getAgentAdapter(provider);
      const generator = adapter.streamWorker({
        apiKey,
        modelId,
        userQuery: content,
        history,
        signal,
      });

      let text = '';
      let doneEvent: any = null;

      for await (const event of generator) {
        if (event.type === 'delta') {
          text += event.text;
          sendEvent('worker_delta', { provider, delta: event.text });
        } else if (event.type === 'done') {
          doneEvent = event;
        } else if (event.type === 'error') {
          sendEvent('worker_error', { provider, modelId, errorType: event.errorType, message: event.message });
          runsToPersist.push({
            provider,
            modelId,
            role: 'worker',
            status: event.errorType,
            inputTokens: 0,
            cachedTokens: 0,
            cacheWriteTokens: 0,
            outputTokens: 0,
            latencyMs: 0,
            ttftMs: null,
            errorMessage: event.message,
          });
          return { provider, modelId, status: event.errorType, text: '' };
        }
      }

      if (doneEvent) {
        sendEvent('worker_done', {
          provider,
          modelId,
          inputTokens: doneEvent.inputTokens,
          cachedInputTokens: doneEvent.cachedInputTokens || 0,
          outputTokens: doneEvent.outputTokens,
          latencyMs: doneEvent.latencyMs,
          ttftMs: doneEvent.ttftMs || null,
          status: 'success',
        });
        runsToPersist.push({
          provider,
          modelId,
          role: 'worker',
          status: 'success',
          inputTokens: doneEvent.inputTokens,
          cachedTokens: doneEvent.cachedInputTokens || 0,
          cacheWriteTokens: doneEvent.cacheWriteTokens || 0,
          outputTokens: doneEvent.outputTokens,
          latencyMs: doneEvent.latencyMs,
          ttftMs: doneEvent.ttftMs || null,
          rawResponse: doneEvent.fullText,
        });
        return { provider, modelId, status: 'success', text: doneEvent.fullText };
      } else {
        throw new Error('Completed without usage metadata');
      }
    } catch (err: any) {
      if (signal.aborted) {
        runsToPersist.push({
          provider,
          modelId,
          role: 'worker',
          status: 'error',
          inputTokens: 0,
          cachedTokens: 0,
          cacheWriteTokens: 0,
          outputTokens: 0,
          latencyMs: 0,
          ttftMs: null,
          errorMessage: 'Client disconnected',
        });
        return { provider, modelId, status: 'error', text: '' };
      }
      const msg = err.message || 'Worker execution error';
      sendEvent('worker_error', { provider, modelId, errorType: 'error', message: msg });
      runsToPersist.push({
        provider,
        modelId,
        role: 'worker',
        status: 'error',
        inputTokens: 0,
        cachedTokens: 0,
        cacheWriteTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        ttftMs: null,
        errorMessage: msg,
      });
      return { provider, modelId, status: 'error', text: '' };
    }
  };

  const workerPromises = selectedWorkers.map(w => runWorker(w, modelSelections[w]));
  const workerResults = await Promise.all(workerPromises);

  let assistantContent = '';
  let producedByModel = '';
  let producedByRole: 'worker' | 'evaluator' = 'worker';

  // 2. Evaluator Pipeline
  if (selectedEvaluator) {
    producedByRole = 'evaluator';
    const evalProvider = selectedEvaluator;
    const evalModelId = modelSelections[evalProvider];
    const evalKey = apiKeys[evalProvider];

    if (!evalKey) {
      const msg = 'Evaluator API Key not configured.';
      sendEvent('error', { message: msg });
      runsToPersist.push({
        provider: evalProvider,
        modelId: evalModelId,
        role: 'evaluator',
        status: 'key_error',
        inputTokens: 0,
        cachedTokens: 0,
        cacheWriteTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        ttftMs: null,
        errorMessage: msg,
      });
      return {
        workerResults,
        runsToPersist,
        assistantContent,
        producedByModel,
        producedByRole,
        evaluatorKeyError: true,
      };
    }

    sendEvent('evaluator_start', { provider: evalProvider, modelId: evalModelId });

    try {
      const evalAdapter = getAgentAdapter(evalProvider);
      const evalGenerator = evalAdapter.streamEvaluator({
        apiKey: evalKey,
        modelId: evalModelId,
        userQuery: content,
        history,
        workerResults: workerResults.map(r => ({
          provider: r.provider,
          modelId: r.modelId,
          text: r.text,
          status: r.status || 'error',
        })),
      });

      let evalDoneEvent: any = null;

      for await (const event of evalGenerator) {
        if (event.type === 'delta') {
          assistantContent += event.text;
          sendEvent('evaluator_delta', { delta: event.text });
        } else if (event.type === 'done') {
          evalDoneEvent = event;
        } else if (event.type === 'error') {
          sendEvent('error', { message: `Evaluator error: ${event.message}` });
          runsToPersist.push({
            provider: evalProvider,
            modelId: evalModelId,
            role: 'evaluator',
            status: event.errorType,
            inputTokens: 0,
            cachedTokens: 0,
            cacheWriteTokens: 0,
            outputTokens: 0,
            latencyMs: 0,
            ttftMs: null,
            errorMessage: event.message,
          });
          return {
            workerResults,
            runsToPersist,
            assistantContent,
            producedByModel,
            producedByRole,
            evaluatorError: true,
          };
        }
      }

      if (evalDoneEvent) {
        sendEvent('evaluator_done', {
          provider: evalProvider,
          modelId: evalModelId,
          inputTokens: evalDoneEvent.inputTokens,
          cachedInputTokens: evalDoneEvent.cachedInputTokens || 0,
          outputTokens: evalDoneEvent.outputTokens,
          latencyMs: evalDoneEvent.latencyMs,
          ttftMs: evalDoneEvent.ttftMs || null,
        });
        runsToPersist.push({
          provider: evalProvider,
          modelId: evalModelId,
          role: 'evaluator',
          status: 'success',
          inputTokens: evalDoneEvent.inputTokens,
          cachedTokens: evalDoneEvent.cachedInputTokens || 0,
          cacheWriteTokens: evalDoneEvent.cacheWriteTokens || 0,
          outputTokens: evalDoneEvent.outputTokens,
          latencyMs: evalDoneEvent.latencyMs,
          ttftMs: evalDoneEvent.ttftMs || null,
          rawResponse: evalDoneEvent.fullText,
        });
        producedByModel = evalModelId;
      } else {
        throw new Error('Evaluator completed without metadata');
      }
    } catch (err: any) {
      const msg = err.message || 'Evaluator execution error';
      sendEvent('error', { message: msg });
      runsToPersist.push({
        provider: evalProvider,
        modelId: evalModelId,
        role: 'evaluator',
        status: 'error',
        inputTokens: 0,
        cachedTokens: 0,
        cacheWriteTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        ttftMs: null,
        errorMessage: msg,
      });
      return {
        workerResults,
        runsToPersist,
        assistantContent,
        producedByModel,
        producedByRole,
        evaluatorError: true,
      };
    }
  } else {
    // No evaluator selected - pick the first successful worker result
    producedByRole = 'worker';
    const successfulWorkerResult = workerResults.find(r => r.status === 'success') || workerResults[0];
    assistantContent = successfulWorkerResult?.text || '';
    producedByModel = successfulWorkerResult?.modelId || '';
  }

  return {
    workerResults,
    runsToPersist,
    assistantContent,
    producedByModel,
    producedByRole,
  };
}
