import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateState, generateCodeVerifier, generateCodeChallenge } from '@/lib/auth/pkce';
import { buildGoogleAuthUrl } from '@/lib/auth/google';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const cookieStore = await cookies();

  // Store state and codeVerifier in short-lived HttpOnly cookies (max 10 minutes)
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  cookieStore.set('oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  const url = buildGoogleAuthUrl({ state, codeChallenge });

  return NextResponse.redirect(url);
}
