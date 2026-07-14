import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';

function getEncryptionKey(): Buffer {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('CREDENTIALS_ENCRYPTION_KEY is not defined in env');
  }
  // Hash the key to exactly 32 bytes (256 bits) to ensure key length validity
  return createHash('sha256').update(secret).digest();
}

export function encrypt(text: string): { encryptedKey: string; iv: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(12); // GCM standard IV is 12 bytes
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag().toString('base64');

  return {
    encryptedKey: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag,
  };
}

export function decrypt(encryptedKey: string, iv: string, authTag: string): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(encryptedKey, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
