import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { sql, eq, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/jwt';
import { db } from '@/db';
import { chats, messages, messageModelRuns, users, apiCredentials } from '@/db/schema';
import { decrypt } from '@/lib/crypto/aesGcm';
import { isRateLimited } from '@/lib/orchestrator/rateLimiter';
import { formatSSE } from '@/lib/orchestrator/sse';
import { getAgentAdapter } from '@/lib/agents/registry';
import { calculateRunCost } from '@/lib/agents/utils';
import { runPipeline } from '@/lib/orchestrator/runPipeline';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  content: z.string().min(1),
  selectedWorkers: z.array(z.string()).min(1),
  selectedEvaluator: z.string().nullable(),
  modelSelections: z.record(z.string(), z.string()),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await context.params;

  // 1. Auth check
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifySession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limiting check
  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 3. Body validation
  let body: any;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsedBody = requestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: parsedBody.error.format() }, { status: 400 });
  }

  const { content, selectedWorkers, selectedEvaluator, modelSelections } = parsedBody.data;

  // 4. Verify chat belongs to user
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, user.id)),
  });

  if (!chat) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  // Get existing messages to determine sequence and history
  const existingMessages = await db.query.messages.findMany({
    where: eq(messages.chatId, chatId),
  });

  const nextSequence = existingMessages.length === 0 ? 0 : Math.max(...existingMessages.map(m => m.sequence)) + 1;
  const history = existingMessages
    .sort((a, b) => a.sequence - b.sequence)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // Decrypt user keys
  const userCreds = await db.query.apiCredentials.findMany({
    where: eq(apiCredentials.userId, user.id),
  });

  const apiKeys: Record<string, string> = {};
  for (const cred of userCreds) {
    try {
      apiKeys[cred.provider] = decrypt(cred.encryptedKey, cred.iv, cred.authTag);
    } catch (e) {
      console.error(`Failed to decrypt credentials for provider ${cred.provider}:`, e);
    }
  }

  // Set up SSE stream
  const encoder = new TextEncoder();
  const runsToPersist: any[] = [];
  const abortController = new AbortController();

  // Listen to connection abort
  request.signal.addEventListener('abort', () => {
    abortController.abort();
    console.log(`SSE Client aborted chatId=${chatId}`);
  });

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(formatSSE(event, data)));
        } catch (e) {
          // If controller is closed, writing fails, ignore
        }
      };

      try {
        // Persist User Message Immediately
        const [userMessage] = await db.insert(messages).values({
          chatId,
          role: 'user',
          content,
          sequence: nextSequence,
        }).returning();

        // 5. Run Worker and Evaluator Orchestration Pipeline
        const {
          runsToPersist: pipelineRuns,
          assistantContent,
          producedByModel,
          producedByRole,
          evaluatorKeyError,
          evaluatorError,
          workerResults,
        } = await runPipeline({
          content,
          history,
          selectedWorkers,
          selectedEvaluator,
          modelSelections,
          apiKeys,
          signal: abortController.signal,
          sendEvent,
        });

        if (evaluatorKeyError || evaluatorError) {
          controller.close();
          return;
        }

        let totalCost = 0;
        let totalInput = 0;
        let totalOutput = 0;

        runsToPersist.push(...pipelineRuns);

        await db.transaction(async (tx) => {
          // Save assistant response message
          const [assistantMessage] = await tx.insert(messages).values({
            chatId,
            role: 'assistant',
            content: assistantContent,
            producedByModel: producedByModel || null,
            producedByRole,
            sequence: nextSequence + 1,
          }).returning();

          // Save runs
          for (const run of runsToPersist) {
            const cost = calculateRunCost(run.provider, run.modelId, run.inputTokens, run.outputTokens, {
              cachedTokens: run.cachedTokens,
              cacheWriteTokens: run.cacheWriteTokens,
            });
            totalCost += cost;
            totalInput += run.inputTokens;
            totalOutput += run.outputTokens;

            await tx.insert(messageModelRuns).values({
              messageId: userMessage.id,
              chatId,
              provider: run.provider,
              modelId: run.modelId,
              role: run.role,
              status: run.status,
              inputTokens: run.inputTokens,
              cachedTokens: run.cachedTokens || 0,
              outputTokens: run.outputTokens,
              costUsd: cost.toFixed(6),
              latencyMs: run.latencyMs,
              ttftMs: run.ttftMs || null,
              rawResponse: run.rawResponse || null,
              errorMessage: run.errorMessage || null,
            });
          }

          // Increment chat totals
          await tx.update(chats)
            .set({
              totalInputTokens: sql`${chats.totalInputTokens} + ${totalInput}`,
              totalOutputTokens: sql`${chats.totalOutputTokens} + ${totalOutput}`,
              totalCostUsd: sql`${chats.totalCostUsd} + ${totalCost.toFixed(6)}`,
              updatedAt: new Date(),
            })
            .where(eq(chats.id, chatId));

          // Increment user totals
          await tx.update(users)
            .set({
              totalInputTokens: sql`${users.totalInputTokens} + ${totalInput}`,
              totalOutputTokens: sql`${users.totalOutputTokens} + ${totalOutput}`,
              totalCostUsd: sql`${users.totalCostUsd} + ${totalCost.toFixed(6)}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));
        });

        // 8. Emit final message metadata
        sendEvent('final_message', {
          messageId: chatId,
          content: assistantContent,
          producedByModel,
          producedByRole,
        });

        // Emit updated usage totals
        const updatedChat = await db.query.chats.findFirst({ where: eq(chats.id, chatId) });
        const updatedUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });

        sendEvent('usage_summary', {
          chat: {
            inputTokens: updatedChat?.totalInputTokens || 0,
            outputTokens: updatedChat?.totalOutputTokens || 0,
            costUsd: updatedChat?.totalCostUsd || '0',
          },
          user: {
            inputTokens: updatedUser?.totalInputTokens || 0,
            outputTokens: updatedUser?.totalOutputTokens || 0,
            costUsd: updatedUser?.totalCostUsd || '0',
          },
        });

        // 9. Auto-Title Generation (awaited before stream close to guarantee delivery)
        // Title is only generated when the full pipeline succeeded with no errors.
        // - Evaluator mode: the evaluator run must be successful (it synthesises from workers).
        // - Worker-only mode: ALL selected workers must succeed (no partial failures).
        const messageSucceeded = producedByRole === 'evaluator'
          ? runsToPersist.some(r => r.role === 'evaluator' && r.status === 'success')
          : workerResults.length > 0 && workerResults.every(r => r.status === 'success');

        const needsTitle = !chat.isTitlePinned && 
          (chat.title === 'New Conversation' || chat.title.startsWith('Chat ') || chat.title === '') && 
          !chat.titleGeneratedByModel;

        if (needsTitle && messageSucceeded) {
          let autoTitleProvider: string | null = null;
          let autoTitleModelId: string | null = null;

          if (producedByRole === 'evaluator') {
            autoTitleProvider = selectedEvaluator;
            autoTitleModelId = producedByModel;
          } else {
            const successfulWorker = workerResults.find(r => r.status === 'success');
            if (successfulWorker) {
              autoTitleProvider = successfulWorker.provider;
              autoTitleModelId = successfulWorker.modelId;
            }
          }

          if (!autoTitleProvider || !autoTitleModelId) {
            if (chat.autoTitleModel) {
              autoTitleProvider = chat.autoTitleModel.split(':')[0];
              autoTitleModelId = chat.autoTitleModel.split(':')[1];
            } else {
              autoTitleProvider = selectedWorkers[0];
              autoTitleModelId = modelSelections[autoTitleProvider];
            }
          }

          const titleKey = autoTitleProvider ? apiKeys[autoTitleProvider] : null;

          if (titleKey && autoTitleProvider && autoTitleModelId) {
            try {
              const title = await getAgentAdapter(autoTitleProvider).runTitle({
                apiKey: titleKey,
                modelId: autoTitleModelId,
                userQuery: content,
              });
              const cleanTitle = title.trim();
              if (cleanTitle) {
                await db.update(chats)
                  .set({ title: cleanTitle, titleGeneratedByModel: `${autoTitleProvider}:${autoTitleModelId}` })
                  .where(eq(chats.id, chatId));
                sendEvent('title_updated', { chatId, title: cleanTitle });
              }
            } catch (e) {
              console.error('Auto-title generation error:', e);
            }
          } else {
            console.warn('[title] Skipped: no valid provider/model/key resolved', {
              autoTitleProvider,
              autoTitleModelId,
              hasKey: !!titleKey
            });
          }
        }
      } catch (err: any) {
        console.error('SSE orchestrator error:', err);
        sendEvent('error', { message: err.message || 'Orchestration pipeline execution error' });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
