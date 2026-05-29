import Link from 'next/link';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type FieldKey =
  | 'half_life_hours'
  | 'tmax_hours'
  | 'duration_of_action_hours'
  | 'warnings'
  | 'red_flags'
  | 'missed_dose_rules'
  | 'storage'
  | 'dose_escalation_phases'
  | 'side_effect_thresholds'
  | 'side_effect_windows'
  | 'injection_sites'
  | 'oral_administration'
  | 'sources'
  // protocol companion blocks
  | 'protocol_timeline'
  | 'dose_cycle_profile'
  | 'symptom_playbooks'
  | 'food_tolerance_rules'
  | 'checkin_protocol'
  | 'red_flag_rules'
  | 'clinician_report_template';

const FIELD_LABEL: Record<FieldKey, string> = {
  half_life_hours: 'half-life',
  tmax_hours: 'tmax',
  duration_of_action_hours: 'duration',
  warnings: 'warnings',
  red_flags: 'red flags',
  missed_dose_rules: 'missed-dose',
  storage: 'storage',
  dose_escalation_phases: 'escalation',
  side_effect_thresholds: 'thresholds',
  side_effect_windows: 'SE windows',
  injection_sites: 'sites',
  oral_administration: 'oral',
  sources: 'sources',
  protocol_timeline: 'timeline',
  dose_cycle_profile: 'dose cycle',
  symptom_playbooks: 'playbooks',
  food_tolerance_rules: 'food rules',
  checkin_protocol: 'check-in',
  red_flag_rules: 'red-flag rules',
  clinician_report_template: 'clinician',
};

const FIELDS: FieldKey[] = Object.keys(FIELD_LABEL) as FieldKey[];

function pill(value: number | boolean) {
  if (typeof value === 'boolean') {
    return value
      ? <Badge variant="success">✓</Badge>
      : <Badge variant="warning">empty</Badge>;
  }
  if (value === 0) return <Badge variant="warning">0</Badge>;
  return <Badge variant="secondary">{value}</Badge>;
}

export default async function DrugCoveragePage() {
  const admin = createAdminSupabaseClient();

  const { data: drugs } = await admin
    .from('peptides')
    .select('id, slug, name, publication_status, half_life_hours, tmax_hours, duration_of_action_hours')
    .order('name', { ascending: true });

  const ids = (drugs ?? []).map((d) => d.id);

  // Batch counts per table per drug_id
  const [
    warnings, missedDose, storage, doseEsc, seThresholds, seWindows, sites, oral, sources,
    timeline, doseCycle, playbooks, foodRules, checkin, redFlagRules, clinician,
  ] = await Promise.all([
    admin.from('drug_warnings').select('drug_id, is_red_flag').in('drug_id', ids),
    admin.from('drug_missed_dose_rules').select('drug_id').in('drug_id', ids),
    admin.from('drug_formulation_storage').select('drug_id').in('drug_id', ids),
    admin.from('drug_dose_escalation_phases').select('drug_id').in('drug_id', ids),
    admin.from('drug_side_effect_thresholds').select('drug_id').in('drug_id', ids),
    admin.from('drug_side_effect_windows').select('drug_id').in('drug_id', ids),
    admin.from('drug_injection_sites').select('drug_id').in('drug_id', ids),
    admin.from('drug_oral_administration').select('drug_id').in('drug_id', ids),
    admin.from('drug_sources').select('drug_id').in('drug_id', ids),
    admin.from('drug_protocol_timeline').select('drug_id').in('drug_id', ids),
    admin.from('drug_dose_cycle_profile').select('drug_id').in('drug_id', ids),
    admin.from('drug_symptom_playbooks').select('drug_id').in('drug_id', ids),
    admin.from('drug_food_tolerance_rules').select('drug_id').in('drug_id', ids),
    admin.from('drug_checkin_protocol').select('drug_id').in('drug_id', ids),
    admin.from('drug_red_flag_rules').select('drug_id').in('drug_id', ids),
    admin.from('drug_clinician_report_template').select('drug_id').in('drug_id', ids),
  ]);

  const tally = (rows: Array<{ drug_id: string }> | null) => {
    const m = new Map<string, number>();
    for (const r of rows ?? []) m.set(r.drug_id, (m.get(r.drug_id) ?? 0) + 1);
    return m;
  };
  const warningCount = tally(warnings.data);
  const redFlagCount = new Map<string, number>();
  for (const w of warnings.data ?? []) {
    if (w.is_red_flag) redFlagCount.set(w.drug_id, (redFlagCount.get(w.drug_id) ?? 0) + 1);
  }
  const counts = {
    warnings: warningCount,
    red_flags: redFlagCount,
    missed_dose_rules: tally(missedDose.data),
    storage: tally(storage.data),
    dose_escalation_phases: tally(doseEsc.data),
    side_effect_thresholds: tally(seThresholds.data),
    side_effect_windows: tally(seWindows.data),
    injection_sites: tally(sites.data),
    oral_administration: tally(oral.data),
    sources: tally(sources.data),
    protocol_timeline: tally(timeline.data),
    dose_cycle_profile: tally(doseCycle.data),
    symptom_playbooks: tally(playbooks.data),
    food_tolerance_rules: tally(foodRules.data),
    checkin_protocol: tally(checkin.data),
    red_flag_rules: tally(redFlagRules.data),
    clinician_report_template: tally(clinician.data),
  };

  const rows = (drugs ?? []).map((d) => {
    const cells: Record<FieldKey, number | boolean> = {
      half_life_hours: d.half_life_hours != null,
      tmax_hours: d.tmax_hours != null,
      duration_of_action_hours: d.duration_of_action_hours != null,
      warnings: counts.warnings.get(d.id) ?? 0,
      red_flags: counts.red_flags.get(d.id) ?? 0,
      missed_dose_rules: counts.missed_dose_rules.get(d.id) ?? 0,
      storage: counts.storage.get(d.id) ?? 0,
      dose_escalation_phases: counts.dose_escalation_phases.get(d.id) ?? 0,
      side_effect_thresholds: counts.side_effect_thresholds.get(d.id) ?? 0,
      side_effect_windows: counts.side_effect_windows.get(d.id) ?? 0,
      injection_sites: counts.injection_sites.get(d.id) ?? 0,
      oral_administration: counts.oral_administration.get(d.id) ?? 0,
      sources: counts.sources.get(d.id) ?? 0,
      protocol_timeline: counts.protocol_timeline.get(d.id) ?? 0,
      dose_cycle_profile: (counts.dose_cycle_profile.get(d.id) ?? 0) > 0,
      symptom_playbooks: counts.symptom_playbooks.get(d.id) ?? 0,
      food_tolerance_rules: counts.food_tolerance_rules.get(d.id) ?? 0,
      checkin_protocol: (counts.checkin_protocol.get(d.id) ?? 0) > 0,
      red_flag_rules: counts.red_flag_rules.get(d.id) ?? 0,
      clinician_report_template: (counts.clinician_report_template.get(d.id) ?? 0) > 0,
    };
    const missing = FIELDS.filter((f) => cells[f] === false || cells[f] === 0).length;
    return { drug: d, cells, missing };
  });

  const publishedRows = rows.filter((r) => r.drug.publication_status === 'published');
  const otherRows = rows.filter((r) => r.drug.publication_status !== 'published');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/drugs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to drugs
        </Link>
        <h1 className="text-2xl font-bold mt-2">API field coverage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Per-drug presence of the structured fields exposed via <code>/api/public/drugs/[slug]</code> —
          including the seven protocol-companion blocks. Numbers are row counts; checks indicate a scalar or
          1:1 record is set. Click a drug to fill gaps in its edit tabs.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Tip: the table scrolls horizontally — the drug name and gap count stay pinned. Amber pills mark empty fields.
        </p>
      </div>

      {(['published', 'other'] as const).map((group) => {
        const groupRows = group === 'published' ? publishedRows : otherRows;
        if (groupRows.length === 0) return null;
        return (
          <section key={group} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group === 'published' ? 'Published' : 'Draft / review / archived'}
            </h2>
            <div className="rounded-[--radius] border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-30 bg-card shadow-[1px_0_0_0_hsl(var(--border))] min-w-[200px]">Drug</TableHead>
                    {FIELDS.map((f) => (
                      <TableHead key={f} className="text-center whitespace-nowrap bg-muted/40">{FIELD_LABEL[f]}</TableHead>
                    ))}
                    <TableHead className="sticky right-0 z-30 bg-card shadow-[-1px_0_0_0_hsl(var(--border))] text-right">Gaps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupRows.map(({ drug, cells, missing }) => (
                    <TableRow key={drug.id} className="group">
                      <TableCell className="sticky left-0 z-10 bg-card group-hover:bg-muted/50 shadow-[1px_0_0_0_hsl(var(--border))]">
                        <Link href={`/admin/drugs/${drug.id}/edit`} className="hover:underline">
                          <span className="font-medium">{drug.name}</span>
                          <span className="block text-xs text-muted-foreground">{drug.slug}</span>
                        </Link>
                      </TableCell>
                      {FIELDS.map((f) => (
                        <TableCell key={f} className="text-center">{pill(cells[f])}</TableCell>
                      ))}
                      <TableCell className="sticky right-0 z-10 bg-card group-hover:bg-muted/50 shadow-[-1px_0_0_0_hsl(var(--border))] text-right">
                        {missing === 0
                          ? <Badge variant="success">complete</Badge>
                          : <Badge variant={missing > 8 ? 'destructive' : 'warning'}>{missing}</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
