import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, verifyGoogleIdToken } from '@/lib/auth/google';
import { findOrCreateUserByGoogleProfile } from '@/db/queries/users';
import { signSession } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;
  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value;

  // 1. Validate state (CSRF check)
  if (!state || !savedState || state !== savedState) {
    return new NextResponse('CSRF state mismatch. Access denied.', { status: 403 });
  }

  // 2. Validate code and code verifier
  if (!code || !codeVerifier) {
    return new NextResponse('Authorization code or verifier missing.', { status: 400 });
  }

  try {
    // 3. Exchange code + verifier for tokens
    const { id_token } = await exchangeCodeForTokens({ code, codeVerifier });

    // 4. Verify Google ID token
    const profile = await verifyGoogleIdToken(id_token);

    // 5. Find or create user in db
    const user = await findOrCreateUserByGoogleProfile(profile);

    // 6. Issue custom JWT session
    const sessionToken = await signSession({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    // 6b. Issue and persist refresh token
    const { generateState } = await import('@/lib/auth/pkce');
    const { createHash } = await import('crypto');
    const { db } = await import('@/db');
    const { refreshTokens } = await import('@/db/schema');

    const rawRefreshToken = generateState();
    const tokenHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // 7. Clear temporary OAuth cookies
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_code_verifier');

    // 8. Set session cookie (7 days)
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // 8b. Set refresh token cookie (30 days, scoped to /api/auth)
    cookieStore.set('refresh_token', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // 9. Redirect to home page
    const baseUrl = new URL('/', request.nextUrl.origin);
    return NextResponse.redirect(baseUrl.toString());
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return new NextResponse('Authentication failed.', { status: 500 });
  }
}
