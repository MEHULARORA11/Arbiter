import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';
import { db } from '@/db';
import { chats, messages, messageModelRuns } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await context.params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifySession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chat = await db.query.chats.findFirst({
      where: and(eq(chats.id, chatId), eq(chats.userId, user.id)),
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, chatId),
      orderBy: asc(messages.sequence),
    });

    const runs = await db.query.messageModelRuns.findMany({
      where: eq(messageModelRuns.chatId, chatId),
    });

    // Attach runs to each message
    const messagesWithRuns = chatMessages.map((msg) => ({
      ...msg,
      runs: runs.filter((r) => r.messageId === msg.id),
    }));

    return NextResponse.json({
      ...chat,
      messages: messagesWithRuns,
    });
  } catch (err: any) {
    console.error('Get chat error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await context.params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifySession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title } = await request.json();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const [updatedChat] = await db
      .update(chats)
      .set({
        title,
        isTitlePinned: true,
        updatedAt: new Date(),
      })
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .returning();

    if (!updatedChat) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(updatedChat);
  } catch (err: any) {
    console.error('Rename chat error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await context.params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifySession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await db
      .delete(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, chatId });
  } catch (err: any) {
    console.error('Delete chat error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
