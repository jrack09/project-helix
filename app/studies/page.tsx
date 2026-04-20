import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { StudyType } from '@/types/database';

type SearchParams = Promise<{
  study_type?: string;
  year?: string;
  peptide?: string;
}>;

export default async function StudiesExplorerPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const supabase = await createServerSupabaseClient();

  let unknownPeptide = false;

  const studyType = sp.study_type;
  const validTypes: StudyType[] = ['human', 'animal', 'in_vitro', 'review', 'meta_analysis'];

  let studyIdsFilter: string[] | null = null;
  const peptideSlug = sp.peptide?.trim();
  if (peptideSlug) {
    const { data: pep } = await supabase.from('peptides').select('id').eq('slug', peptideSlug).maybeSingle();
    if (!pep) {
      unknownPeptide = true;
    } else {
      const { data: joinRows } = await supabase.from('study_peptides').select('study_id').eq('peptide_id', pep.id);
      studyIdsFilter = (joinRows ?? []).map((r) => r.study_id);
    }
  }

  let studies: unknown[] | null = null;

  if (unknownPeptide) {
    studies = [];
  } else if (peptideSlug && studyIdsFilter && studyIdsFilter.length === 0) {
    studies = [];
  } else {
    let query = supabase.from('studies').select('*').order('publication_date', { ascending: false });

    if (studyType && validTypes.includes(studyType as StudyType)) {
      query = query.eq('study_type', studyType as StudyType);
    }

    const year = sp.year ? parseInt(sp.year, 10) : NaN;
    if (!Number.isNaN(year)) {
      query = query.gte('publication_date', `${year}-01-01`).lte('publication_date', `${year}-12-31`);
    }

    if (studyIdsFilter && studyIdsFilter.length > 0) {
      query = query.in('id', studyIdsFilter);
    }

    const res = await query;
    studies = res.data;
  }

  type StudyRow = {
    id: string;
    title: string;
    study_type: string;
    publication_date: string | null;
    sample_size: number | null;
    population: string | null;
    abstract: string | null;
    source_url: string;
  };

  const list = (studies ?? []) as StudyRow[];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Study explorer</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Filter indexed publications. Metadata is extracted for research navigation — not to direct clinical decisions.
        </p>
      </div>

      {unknownPeptide && (
        <p className="text-sm text-muted-foreground">No peptide matches slug &ldquo;{peptideSlug}&rdquo;. Clear the peptide filter to see all studies.</p>
      )}

      <form method="get" className="rounded-lg border border-border p-5 space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="study_type">Study type</label>
          <select
            id="study_type"
            name="study_type"
            defaultValue={studyType ?? ''}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Any</option>
            <option value="human">Human</option>
            <option value="animal">Animal</option>
            <option value="in_vitro">In vitro</option>
            <option value="review">Review</option>
            <option value="meta_analysis">Meta-analysis</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="year">Publication year</label>
          <input
            id="year"
            name="year"
            placeholder="e.g. 2020"
            defaultValue={sp.year ?? ''}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground" htmlFor="peptide">Peptide slug</label>
          <input
            id="peptide"
            name="peptide"
            placeholder="e.g. bpc-157"
            defaultValue={sp.peptide ?? ''}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Apply filters
        </button>
      </form>

      <ul className="space-y-4 list-none p-0">
        {list.map((s) => (
          <li key={s.id} className="rounded-lg border border-border p-5 space-y-2">
            <strong className="text-sm font-semibold">{s.title}</strong>
            <span className="block text-xs text-muted-foreground">
              {s.study_type.replace(/_/g, ' ')}
              {s.publication_date ? ` · ${s.publication_date}` : ''}
              {s.sample_size != null ? ` · n=${s.sample_size}` : ''}
              {s.population ? ` · ${s.population}` : ''}
            </span>
            {s.abstract && <p className="text-sm m-0">{s.abstract}</p>}
            <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">
              Source
            </a>
          </li>
        ))}
      </ul>

      {list.length === 0 && !unknownPeptide && <p className="text-sm text-muted-foreground">No studies match these filters.</p>}

      <p className="text-sm">
        <Link href="/peptides" className="font-medium hover:underline">Browse peptides →</Link>
      </p>
    </main>
  );
}
