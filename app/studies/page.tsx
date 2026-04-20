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
    <main className="container stack" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <div>
        <h1 style={{ marginBottom: 8 }}>Study explorer</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          Filter indexed publications. Metadata is extracted for research navigation — not to direct clinical decisions.
        </p>
      </div>

      {unknownPeptide && (
        <p className="muted">No peptide matches slug “{peptideSlug}”. Clear the peptide filter to see all studies.</p>
      )}

      <form method="get" className="card stack" style={{ maxWidth: 640 }}>
        <label className="stack" style={{ gap: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Study type
          </span>
          <select name="study_type" className="input" defaultValue={studyType ?? ''}>
            <option value="">Any</option>
            <option value="human">Human</option>
            <option value="animal">Animal</option>
            <option value="in_vitro">In vitro</option>
            <option value="review">Review</option>
            <option value="meta_analysis">Meta-analysis</option>
          </select>
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Publication year
          </span>
          <input name="year" className="input" placeholder="e.g. 2020" defaultValue={sp.year ?? ''} />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Peptide slug
          </span>
          <input name="peptide" className="input" placeholder="e.g. bpc-157" defaultValue={sp.peptide ?? ''} />
        </label>
        <button className="button" type="submit" style={{ width: 'fit-content' }}>
          Apply filters
        </button>
      </form>

      <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
        {list.map((s) => (
          <li key={s.id} className="card stack">
            <strong>{s.title}</strong>
            <span className="muted" style={{ fontSize: 13 }}>
              {s.study_type.replace(/_/g, ' ')}
              {s.publication_date ? ` · ${s.publication_date}` : ''}
              {s.sample_size != null ? ` · n=${s.sample_size}` : ''}
              {s.population ? ` · ${s.population}` : ''}
            </span>
            {s.abstract && <p style={{ margin: 0 }}>{s.abstract}</p>}
            <a href={s.source_url} target="_blank" rel="noopener noreferrer">
              Source
            </a>
          </li>
        ))}
      </ul>

      {list.length === 0 && !unknownPeptide && <p className="muted">No studies match these filters.</p>}

      <p>
        <Link href="/peptides">Browse peptides →</Link>
      </p>
    </main>
  );
}
