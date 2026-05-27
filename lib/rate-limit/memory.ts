/** Best-effort in-process limiter (resets on cold start). For production at scale use a shared store. */

const windows = new Map<string, number[]>();

export function rateLimitExceeded(
  key: string,
  maxPerMinute: number,
  now = Date.now()
): boolean {
  const windowStart = now - 60_000;
  const stamps = windows.get(key)?.filter((t) => t > windowStart) ?? [];
  stamps.push(now);
  windows.set(key, stamps);
  return stamps.length > maxPerMinute;
}
