import type { DrugSourceType, EvidenceLevel } from '@/types/database';

export type DisplayTier =
  | 'research_backed'
  | 'regulatory'
  | 'educational'
  | 'investigational_context';

export type UnifiedSourceType = DrugSourceType | 'human_rct' | 'review' | 'meta_analysis' | 'animal' | 'in_vitro';

export type UnifiedSource = {
  id: string;
  source_type: UnifiedSourceType;
  label: string;
  url: string | null;
  region: string | null;
  authority: string | null;
  citation_text: string | null;
  retrieved_at: string | null;
  doi: string | null;
  pubmed_id: string | null;
  study_type: string | null;
  sample_size: number | null;
  publication_date: string | null;
  ordinal: number;
};

export type ClaimEvidenceLevel = EvidenceLevel | 'regulatory';

export type EvidenceClaim = {
  id: string;
  field: string;
  text: string;
  source_ids: string[];
  evidence_level: ClaimEvidenceLevel;
  display_tier: DisplayTier;
};

export type AssembledEvidence = {
  slug: string;
  evidence_score: number | null;
  sources: UnifiedSource[];
  claims: EvidenceClaim[];
};

export type EvidenceDrugRow = {
  id: string;
  slug: string;
  evidence_score: number | null;
  status_label: string;
};
