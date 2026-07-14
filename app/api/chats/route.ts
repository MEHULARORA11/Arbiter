import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';
import { db } from '@/db';
import { chats } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
    const userChats = await db.query.chats.findMany({
      where: eq(chats.userId, user.id),
      orderBy: desc(chats.updatedAt),
    });
    return NextResponse.json(userChats);
  } catch (err: any) {
    console.error('List chats error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Support bulk importing guest chats
    if (body.importChats && Array.isArray(body.importChats)) {
      const { messages } = await import('@/db/schema');
      const imported = [];

      for (const guestChat of body.importChats) {
        const [newChat] = await db
          .insert(chats)
          .values({
            userId: user.id,
            title: guestChat.title || 'Imported Guest Conversation',
            selectedWorkers: guestChat.selectedWorkers || body.selectedWorkers || [],
            selectedEvaluator: guestChat.selectedEvaluator || body.selectedEvaluator || null,
            autoTitleModel: guestChat.autoTitleModel || body.autoTitleModel || null,
          })
          .returning();

        if (guestChat.messages && Array.isArray(guestChat.messages)) {
          let sequence = 0;
          for (const msg of guestChat.messages) {
            await db.insert(messages).values({
              chatId: newChat.id,
              role: msg.role,
              content: msg.content,
              sequence: sequence++,
            });
          }
        }
        imported.push(newChat);
      }

      return NextResponse.json(imported);
    }

    const { title, selectedWorkers, selectedEvaluator, autoTitleModel } = body;

    const [newChat] = await db
      .insert(chats)
      .values({
        userId: user.id,
        title: title || 'New Conversation',
        selectedWorkers: selectedWorkers || [],
        selectedEvaluator: selectedEvaluator || null,
        autoTitleModel: autoTitleModel || null,
      })
      .returning();

    return NextResponse.json(newChat);
  } catch (err: any) {
    console.error('Create chat error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
