export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type StudyType = 'human' | 'animal' | 'in_vitro' | 'review' | 'meta_analysis';
export type ProfileRole = 'member' | 'admin' | 'editor';
export type PublicationStatus = 'draft' | 'in_review' | 'published' | 'archived';
export type FoodGuidanceCategory = 'prefer' | 'limit' | 'avoid' | 'hydrate';
export type EvidenceLevel = 'anecdotal' | 'editorial' | 'study_backed';
export type TipCategory = 'administration' | 'timing' | 'mindset' | 'exercise' | 'sleep' | 'hydration' | 'nutrition' | 'other';
export type ContentReviewAction = 'approved' | 'rejected' | 'requested_changes';
export type ContentReviewEntityType = 'drug' | 'expectation' | 'food_guidance' | 'tip' | 'side_effect_tip' | 'ai_summary' | 'guide';
export type AdministrationRoute = 'subcutaneous_injection' | 'intramuscular_injection' | 'oral' | 'intranasal' | 'topical' | 'intravenous';
export type GuideCategory = 'getting_started' | 'administration' | 'nutrition' | 'side_effects' | 'lifestyle' | 'other';

/** Empty FK graph — extend when you add PostgREST relationships */
type EmptyRel = [];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          region_code: string | null;
          role: ProfileRole;
          disclaimer_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          region_code?: string | null;
          role?: ProfileRole;
          disclaimer_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: EmptyRel;
      };
      peptides: {
        Row: {
          id: string;
          slug: string;
          name: string;
          aliases: Json;
          short_description: string | null;
          mechanism_summary: string | null;
          receptor_targets: Json;
          evidence_score: number | null;
          status_label: string;
          is_visible: boolean;
          publication_status: PublicationStatus;
          generic_name: string | null;
          brand_names: Json;
          drug_class: string | null;
          administration_route: string | null;
          typical_dosing_schedule: string | null;
          prescription_required: boolean;
          contraindications: string | null;
          drug_interactions: Json;
          storage_handling: string | null;
          pharmacokinetics: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          aliases?: Json;
          short_description?: string | null;
          mechanism_summary?: string | null;
          receptor_targets?: Json;
          evidence_score?: number | null;
          status_label?: string;
          is_visible?: boolean;
          publication_status?: PublicationStatus;
          generic_name?: string | null;
          brand_names?: Json;
          drug_class?: string | null;
          administration_route?: string | null;
          typical_dosing_schedule?: string | null;
          prescription_required?: boolean;
          contraindications?: string | null;
          drug_interactions?: Json;
          storage_handling?: string | null;
          pharmacokinetics?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['peptides']['Insert']>;
        Relationships: EmptyRel;
      };
      drug_expectations: {
        Row: {
          id: string;
          drug_id: string;
          week_number: number;
          milestone: string;
          description: string;
          is_common: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          drug_id: string;
          week_number: number;
          milestone: string;
          description: string;
          is_common?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['drug_expectations']['Insert']>;
        Relationships: EmptyRel;
      };
      drug_food_guidance: {
        Row: {
          id: string;
          drug_id: string;
          category: FoodGuidanceCategory;
          item: string;
          rationale: string | null;
          evidence_level: EvidenceLevel;
          ordinal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          drug_id: string;
          category: FoodGuidanceCategory;
          item: string;
          rationale?: string | null;
          evidence_level?: EvidenceLevel;
          ordinal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['drug_food_guidance']['Insert']>;
        Relationships: EmptyRel;
      };
      drug_side_effect_tips: {
        Row: {
          id: string;
          side_effect_id: string;
          strategy: string;
          when_to_seek_help: string | null;
          ordinal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          side_effect_id: string;
          strategy: string;
          when_to_seek_help?: string | null;
          ordinal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['drug_side_effect_tips']['Insert']>;
        Relationships: EmptyRel;
      };
      drug_tips: {
        Row: {
          id: string;
          drug_id: string;
          category: TipCategory;
          title: string;
          body_markdown: string;
          ordinal: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          drug_id: string;
          category: TipCategory;
          title: string;
          body_markdown: string;
          ordinal?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['drug_tips']['Insert']>;
        Relationships: EmptyRel;
      };
      guides: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          body_markdown: string;
          category: GuideCategory;
          cover_emoji: string | null;
          ordinal: number;
          publication_status: PublicationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          body_markdown?: string;
          category?: GuideCategory;
          cover_emoji?: string | null;
          ordinal?: number;
          publication_status?: PublicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['guides']['Insert']>;
        Relationships: EmptyRel;
      };
      content_reviews: {
        Row: {
          id: string;
          entity_type: ContentReviewEntityType;
          entity_id: string;
          reviewer_id: string | null;
          action: ContentReviewAction;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: ContentReviewEntityType;
          entity_id: string;
          reviewer_id?: string | null;
          action: ContentReviewAction;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['content_reviews']['Insert']>;
        Relationships: EmptyRel;
      };
      studies: {
        Row: {
          id: string;
          title: string;
          journal: string | null;
          publication_date: string | null;
          study_type: StudyType;
          sample_size: number | null;
          population: string | null;
          source_url: string;
          doi: string | null;
          abstract: string | null;
          publication_status: PublicationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          journal?: string | null;
          publication_date?: string | null;
          study_type: StudyType;
          sample_size?: number | null;
          population?: string | null;
          source_url: string;
          doi?: string | null;
          abstract?: string | null;
          publication_status?: PublicationStatus;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['studies']['Insert']>;
        Relationships: EmptyRel;
      };
      study_peptides: {
        Row: {
          id: string;
          peptide_id: string;
          study_id: string;
        };
        Insert: {
          id?: string;
          peptide_id: string;
          study_id: string;
        };
        Update: Partial<Database['public']['Tables']['study_peptides']['Insert']>;
        Relationships: EmptyRel;
      };
      study_dosages: {
        Row: {
          id: string;
          peptide_id: string;
          study_id: string;
          dosage_value: number | null;
          dosage_unit: string | null;
          frequency: string | null;
          duration: string | null;
          context_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          peptide_id: string;
          study_id: string;
          dosage_value?: number | null;
          dosage_unit?: string | null;
          frequency?: string | null;
          duration?: string | null;
          context_note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['study_dosages']['Insert']>;
        Relationships: EmptyRel;
      };
      study_outcomes: {
        Row: {
          id: string;
          peptide_id: string;
          study_id: string;
          outcome_type: string | null;
          description: string;
          significance: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          peptide_id: string;
          study_id: string;
          outcome_type?: string | null;
          description: string;
          significance?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['study_outcomes']['Insert']>;
        Relationships: EmptyRel;
      };
      side_effects: {
        Row: {
          id: string;
          peptide_id: string;
          study_id: string;
          effect: string;
          severity: string | null;
          frequency: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          peptide_id: string;
          study_id: string;
          effect: string;
          severity?: string | null;
          frequency?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['side_effects']['Insert']>;
        Relationships: EmptyRel;
      };
      ai_summaries: {
        Row: {
          id: string;
          peptide_id: string;
          summary_text: string;
          model_name: string | null;
          last_generated_at: string;
          guardrail_passed: boolean;
          created_at: string;
          evidence_strength: string | null;
          limitations_text: string | null;
        };
        Insert: {
          id?: string;
          peptide_id: string;
          summary_text: string;
          model_name?: string | null;
          last_generated_at?: string;
          guardrail_passed?: boolean;
          created_at?: string;
          evidence_strength?: string | null;
          limitations_text?: string | null;
        };
        Update: Partial<Database['public']['Tables']['ai_summaries']['Insert']>;
        Relationships: EmptyRel;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan_code: string;
          status: string;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_code: string;
          status: string;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
        Relationships: EmptyRel;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          meta?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
        Relationships: EmptyRel;
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          key_prefix: string;
          key_hash: string;
          name: string | null;
          rate_limit_per_minute: number;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          key_prefix: string;
          key_hash: string;
          name?: string | null;
          rate_limit_per_minute?: number;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>;
        Relationships: EmptyRel;
      };
    };
    Views: {
      peptide_observed_dosage_ranges: {
        Row: {
          peptide_id: string;
          min_dosage: number | null;
          max_dosage: number | null;
          observation_count: number;
          dosage_unit: string | null;
        };
        Relationships: EmptyRel;
      };
      peptide_observed_dosage_ranges_by_context: {
        Row: {
          peptide_id: string;
          context_bucket: string;
          min_dosage: number | null;
          max_dosage: number | null;
          observation_count: number;
          dosage_unit: string | null;
        };
        Relationships: EmptyRel;
      };
    };
    Functions: Record<
      string,
      {
        Args: Record<string, unknown>;
        Returns: unknown;
      }
    >;
  };
};
