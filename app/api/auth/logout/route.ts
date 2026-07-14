import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';
import { db } from '@/db';
import { refreshTokens } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (sessionToken) {
    const user = await verifySession(sessionToken);
    if (user) {
      // Revoke all refresh tokens stored in the DB for this user
      try {
        await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
      } catch (error) {
        console.error('Failed to revoke refresh tokens during logout:', error);
      }
    }
  }

  // Clear the cookies
  cookieStore.delete('session');
  cookieStore.set('refresh_token', '', { path: '/api/auth', maxAge: 0 });

  return NextResponse.json({ success: true });
}
