import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { db } from '@/db';
import { refreshTokens, users } from '@/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { signSession } from '@/lib/auth/jwt';
import { generateState } from '@/lib/auth/pkce';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const rawRefreshToken = cookieStore.get('refresh_token')?.value;

  if (!rawRefreshToken) {
    return NextResponse.json({ error: 'Missing refresh token' }, { status: 401 });
  }

  const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');

  // Find valid, unexpired, unrevoked refresh token row
  const tokenRow = await db.query.refreshTokens.findFirst({
    where: and(
      eq(refreshTokens.tokenHash, tokenHash),
      isNull(refreshTokens.revokedAt),
      gt(refreshTokens.expiresAt, new Date())
    ),
  });

  if (!tokenRow) {
    // Clear both cookies
    cookieStore.delete('session');
    cookieStore.set('refresh_token', '', { path: '/api/auth', maxAge: 0 });
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, tokenRow.userId),
  });

  if (!user) {
    cookieStore.delete('session');
    cookieStore.set('refresh_token', '', { path: '/api/auth', maxAge: 0 });
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // Generate new refresh token
  const newRawRefreshToken = generateState();
  const newTokenHash = createHash('sha256').update(newRawRefreshToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  // Perform rotation in transaction
  try {
    await db.transaction(async (tx) => {
      // Revoke current refresh token
      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, tokenRow.id));

      // Insert new refresh token
      await tx.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: newTokenHash,
        expiresAt,
      });
    });
  } catch (err) {
    console.error('Refresh token rotation transaction failed:', err);
    return NextResponse.json({ error: 'Failed to rotate tokens' }, { status: 500 });
  }

  // Issue new session token
  const sessionToken = await signSession({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  });

  // Set session cookie (7 days)
  cookieStore.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  // Set refresh token cookie (30 days, scoped to /api/auth)
  cookieStore.set('refresh_token', newRawRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60,
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  });
}
