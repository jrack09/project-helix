import type { UnifiedSourceType } from '@/lib/evidence/types';

const DOI_PATTERN = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;
const PUBMED_PATTERN = /pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/i;

export const EXCLUDED_DOIS = new Set(['10.1000/example.demo']);

export function extractDoiFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(DOI_PATTERN);
  return match?.[0] ?? null;
}

export function extractPubmedId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(PUBMED_PATTERN);
  return match?.[1] ?? null;
}

export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/\/+$/, '').trim();
}

export function studyToUnifiedSourceType(studyType: string): UnifiedSourceType {
  if (studyType === 'human') return 'human_rct';
  if (studyType === 'review') return 'review';
  if (studyType === 'meta_analysis') return 'meta_analysis';
  if (studyType === 'animal') return 'animal';
  if (studyType === 'in_vitro') return 'in_vitro';
  return 'study';
}
