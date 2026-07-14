import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';
import { db } from '@/db';
import { apiCredentials } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, encrypt } from '@/lib/crypto/aesGcm';
import { checkKeyValidity } from '@/lib/validation/apiKeys';

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

  const creds = await db.query.apiCredentials.findMany({
    where: eq(apiCredentials.userId, user.id),
  });

  const response = creds.map((c) => {
    let decrypted = '';
    try {
      decrypted = decrypt(c.encryptedKey, c.iv, c.authTag);
    } catch (e) {
      console.error('Decryption failed for provider:', c.provider, e);
    }
    const clean = decrypted.trim();
    const last4 = clean.length > 4 ? clean.slice(-4) : clean;
    return {
      provider: c.provider,
      hasKey: true,
      last4,
    };
  });

  return NextResponse.json(response);
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
    const { provider, apiKey } = await request.json();
    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and apiKey are required' }, { status: 400 });
    }

    const validity = checkKeyValidity(provider, apiKey);
    if (validity !== 'valid') {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    // Encrypt the key
    const { encryptedKey, iv, authTag } = encrypt(apiKey);

    // Upsert key credentials
    await db.insert(apiCredentials).values({
      userId: user.id,
      provider: provider.toLowerCase(),
      encryptedKey,
      iv,
      authTag,
    }).onConflictDoUpdate({
      target: [apiCredentials.userId, apiCredentials.provider],
      set: {
        encryptedKey,
        iv,
        authTag,
        updatedAt: new Date(),
      },
    });

    const clean = apiKey.trim();
    const last4 = clean.length > 4 ? clean.slice(-4) : clean;

    return NextResponse.json({ success: true, provider, hasKey: true, last4 });
  } catch (err: any) {
    console.error('Save credentials error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
