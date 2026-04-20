import { createHash, randomBytes } from 'crypto';

export function generateApiKey(): { fullKey: string; prefix: string; hash: string } {
  const secret = randomBytes(24).toString('base64url');
  const prefix = `pip_${randomBytes(4).toString('hex')}`;
  const fullKey = `${prefix}_${secret}`;
  const hash = sha256Hex(fullKey);
  return { fullKey, prefix, hash };
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
