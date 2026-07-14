// Simple sliding window rate limiter in memory (Upgrade to Redis for multi-instance production environments)
const rateLimitMap = new Map<string, number[]>();

export function isRateLimited(userId: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];

  // Filter timestamps within the current window
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(userId, validTimestamps);
  return false;
}
