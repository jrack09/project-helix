import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { StudyType } from '@/types/database';

const STUDY_TYPES: StudyType[] = ['human', 'animal', 'in_vitro', 'review', 'meta_analysis'];

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const url = new URL(request.url);

  let query = supabase.from('studies').select('*').order('publication_date', { ascending: false });

  const studyType = url.searchParams.get('study_type');
  if (studyType && STUDY_TYPES.includes(studyType as StudyType)) {
    query = query.eq('study_type', studyType as StudyType);
  }

  const year = url.searchParams.get('year');
  if (year && !Number.isNaN(parseInt(year, 10))) {
    const y = parseInt(year, 10);
    query = query.gte('publication_date', `${y}-01-01`).lte('publication_date', `${y}-12-31`);
  }

  const peptideSlug = url.searchParams.get('peptide');
  if (peptideSlug) {
    const { data: pep } = await supabase.from('peptides').select('id').eq('slug', peptideSlug).maybeSingle();
    if (!pep) {
      return NextResponse.json({ studies: [] });
    }
    const { data: joinRows } = await supabase.from('study_peptides').select('study_id').eq('peptide_id', pep.id);
    const ids = (joinRows ?? []).map((r) => r.study_id);
    if (ids.length === 0) {
      return NextResponse.json({ studies: [] });
    }
    query = query.in('id', ids);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ studies: data ?? [] });
}
