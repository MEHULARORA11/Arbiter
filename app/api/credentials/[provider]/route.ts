import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';
import { db } from '@/db';
import { apiCredentials } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
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
    await db
      .delete(apiCredentials)
      .where(
        and(
          eq(apiCredentials.userId, user.id),
          eq(apiCredentials.provider, provider.toLowerCase())
        )
      );

    return NextResponse.json({ success: true, provider });
  } catch (err: any) {
    console.error('Delete credentials error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
