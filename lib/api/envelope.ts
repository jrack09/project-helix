import type { DisclaimerObject } from '@/lib/compliance/disclaimers';

export type ApiEnvelope<T> = {
  data: T;
  disclaimer: DisclaimerObject;
  meta: {
    version: 'v1';
    last_updated: string; // ISO datetime
  };
};

export function envelope<T>(
  data: T,
  disclaimer: DisclaimerObject,
  lastUpdated?: string | Date | null,
): ApiEnvelope<T> {
  return {
    data,
    disclaimer,
    meta: {
      version: 'v1',
      last_updated: lastUpdated
        ? new Date(lastUpdated).toISOString()
        : new Date().toISOString(),
    },
  };
}
