import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { formatSSE } from '@/lib/orchestrator/sse';
import { runPipeline } from '@/lib/orchestrator/runPipeline';
import { calculateRunCost } from '@/lib/agents/utils';

export const dynamic = 'force-dynamic';

const guestRequestSchema = z.object({
  content: z.string().min(1),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string()
    })
  ),
  selectedWorkers: z.array(z.string()).min(1),
  selectedEvaluator: z.string().nullable(),
  modelSelections: z.record(z.string(), z.string()),
  apiKeys: z.record(z.string(), z.string()).refine(
    keys => Object.keys(keys).length > 0,
    { message: 'apiKeys must not be empty' }
  )
});

// Simple in-memory rate limiter map for guest IPs
// TODO: Replace with Redis or middleware-based rate limiting in production.
const ipCache = new Map<string, { count: number; resetTime: number }>();

function isIpRateLimited(ip: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const state = ipCache.get(ip);
  if (!state || now > state.resetTime) {
    ipCache.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }
  state.count++;
  return state.count > limit;
}

export const POST = async (request: NextRequest) => {
  // 1. Rate limit check by IP
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  if (isIpRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2. Parse body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsedBody = guestRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.format() }, { status: 400 });
  }

  const { content, history, selectedWorkers, selectedEvaluator, modelSelections, apiKeys } = parsedBody.data;

  // 3. Set up SSE stream
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  request.signal.addEventListener('abort', () => abortController.abort());

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(formatSSE(event, data)));
        } catch {}
      };
      try {
        const {
          runsToPersist,
          assistantContent,
          producedByModel,
          producedByRole,
          evaluatorKeyError,
          evaluatorError
        } = await runPipeline({
          content,
          history,
          selectedWorkers,
          selectedEvaluator,
          modelSelections,
          apiKeys,
          signal: abortController.signal,
          sendEvent
        });

        if (evaluatorKeyError || evaluatorError) {
          controller.close();
          return;
        }

        sendEvent('final_message', {
          messageId: `msg_${Date.now()}`,
          content: assistantContent,
          producedByModel,
          producedByRole
        });

        // usage summary
        let turnCost = 0;
        let turnInput = 0;
        let turnOutput = 0;
        for (const run of runsToPersist) {
          const cost = calculateRunCost(
            run.provider,
            run.modelId,
            run.inputTokens,
            run.outputTokens,
            { cachedTokens: run.cachedTokens, cacheWriteTokens: run.cacheWriteTokens }
          );
          turnCost += cost;
          turnInput += run.inputTokens;
          turnOutput += run.outputTokens;
        }

        sendEvent('usage_summary', {
          chat: { inputTokens: turnInput, outputTokens: turnOutput, costUsd: turnCost.toFixed(6) },
          user: { inputTokens: turnInput, outputTokens: turnOutput, costUsd: turnCost.toFixed(6) }
        });
      } catch (err: any) {
        console.error('SSE guest orchestrator error:', err);
        sendEvent('error', { message: err.message || 'Orchestration pipeline execution error' });
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
};
