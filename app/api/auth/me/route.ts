import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await verifySession(sessionToken);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { db } = await import('@/db');
  const { users } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatarUrl,
    totalInputTokens: dbUser.totalInputTokens,
    totalOutputTokens: dbUser.totalOutputTokens,
    totalCostUsd: dbUser.totalCostUsd,
  });
}
