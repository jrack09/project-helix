'use client';

import { useActionState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';
import type { Database } from '@/types/database';
import {
  addProtocolTimelinePhase, deleteProtocolTimelinePhase,
  saveDoseCycleProfile,
  addSymptomPlaybook, deleteSymptomPlaybook,
  addSymptomPlaybookBand, deleteSymptomPlaybookBand,
  addFoodToleranceRule, deleteFoodToleranceRule,
  saveCheckinProtocol, addCheckinQuestion, deleteCheckinQuestion,
  addRedFlagRule, deleteRedFlagRule,
  saveClinicianReportTemplate,
} from '../../../actions';

type TimelinePhase = Database['public']['Tables']['drug_protocol_timeline']['Row'];
type DoseCycle = Database['public']['Tables']['drug_dose_cycle_profile']['Row'];
type Playbook = Database['public']['Tables']['drug_symptom_playbooks']['Row'];
type PlaybookBand = Database['public']['Tables']['drug_symptom_playbook_bands']['Row'];
type FoodRule = Database['public']['Tables']['drug_food_tolerance_rules']['Row'];
type CheckinProtocol = Database['public']['Tables']['drug_checkin_protocol']['Row'];
type CheckinQuestion = Database['public']['Tables']['drug_checkin_questions']['Row'];
type RedFlagRule = Database['public']['Tables']['drug_red_flag_rules']['Row'];
type ClinicianReport = Database['public']['Tables']['drug_clinician_report_template']['Row'];
type SideEffectLite = { id: string; effect: string };

const FOOD_CONTEXTS = [
  'low_appetite', 'nausea', 'constipation', 'reflux', 'diarrhea',
  'dose_escalation_week', 'day_before_dose', 'post_dose_peak', 'post_dose_nausea_window',
] as const;
const ACTION_LEVELS = ['monitor', 'contact_prescriber', 'urgent_care', 'emergency'] as const;

function FormError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

function useAddAction(action: (fd: FormData) => Promise<void>) {
  return useActionState(
    async (_: string | null, formData: FormData) => {
      try { await action(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-muted-foreground hover:text-destructive transition-colors"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function selectClass() {
  return 'flex h-9 w-full rounded-[--radius] border border-input bg-transparent px-3 py-1 text-sm';
}

function ArrayPills({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {items.map((it, i) => (
        <Badge key={i} variant="outline" className="text-[10px]">{it}</Badge>
      ))}
    </div>
  );
}

// ── 1. Protocol timeline ───────────────────────────────────

export function ProtocolTimelineTab({ drugId, phases }: { drugId: string; phases: TimelinePhase[] }) {
  const [error, formAction, pending] = useAddAction(addProtocolTimelinePhase);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {phases.map((p) => (
          <div key={p.id} className="flex items-start gap-3 rounded-[--radius] border p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {p.phase_title}{' '}
                <span className="text-muted-foreground font-normal">
                  · weeks {p.week_start}{p.week_end ? `–${p.week_end}` : '+'}
                  {p.typical_dose_mg != null && ` · ${p.typical_dose_mg} mg`}
                  {p.cadence_days != null && ` · every ${p.cadence_days}d`}
                </span>
              </p>
              {p.protocol_label && <p className="text-xs text-muted-foreground">{p.protocol_label}</p>}
              <ArrayPills items={p.expected_changes} />
            </div>
            <DeleteButton onClick={() => startTransition(() => deleteProtocolTimelinePhase(p.id, drugId))} />
          </div>
        ))}
      </div>

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add timeline phase</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pt-title">Phase title</Label>
            <Input id="pt-title" name="phase_title" placeholder="Starter phase" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pt-label">Protocol label</Label>
            <Input id="pt-label" name="protocol_label" placeholder="Standard escalation" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pt-ws">Week start</Label>
            <Input id="pt-ws" name="week_start" type="number" min="0" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pt-we">Week end (blank = open)</Label>
            <Input id="pt-we" name="week_end" type="number" min="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pt-dose">Typical dose (mg)</Label>
            <Input id="pt-dose" name="typical_dose_mg" type="number" step="0.01" min="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pt-cad">Cadence (days)</Label>
            <Input id="pt-cad" name="cadence_days" type="number" min="1" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pt-ec">Expected changes (one per line)</Label>
          <Textarea id="pt-ec" name="expected_changes" rows={2} placeholder={'early appetite reduction\npossible nausea'} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pt-ca">Common adjustments (one per line)</Label>
          <Textarea id="pt-ca" name="common_adjustments" rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pt-uf">User focus (one per line)</Label>
          <Textarea id="pt-uf" name="user_focus" rows={2} />
        </div>
        <Button type="submit" size="sm" disabled={pending}>{pending ? 'Adding…' : 'Add phase'}</Button>
      </form>
    </div>
  );
}

// ── 2. Dose-cycle profile (1:1) ────────────────────────────

export function DoseCycleTab({ drugId, profile }: { drugId: string; profile: DoseCycle | null }) {
  const [error, formAction, pending] = useAddAction(saveDoseCycleProfile);
  const field = (
    name: keyof DoseCycle,
    label: string,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`dc-${name}`}>{label}</Label>
      <Input
        id={`dc-${name}`}
        name={name as string}
        type="number"
        step="0.1"
        min="0"
        defaultValue={(profile?.[name] as number | null) ?? ''}
      />
    </div>
  );

  return (
    <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
      <p className="text-sm font-medium">Dose-cycle profile (hours from dose; one row per drug)</p>
      <p className="text-xs text-muted-foreground">
        Window fields are min/max pairs. onset / coverage fall back to the numeric PK on the drug if left blank.
      </p>
      <input type="hidden" name="drug_id" value={drugId} />
      <FormError error={error} />
      <div className="grid grid-cols-2 gap-3">
        {field('onset_hours', 'Onset (h)')}
        {field('coverage_fades_after_hours', 'Coverage fades after (h)')}
        {field('peak_effect_hours_min', 'Peak effect min (h)')}
        {field('peak_effect_hours_max', 'Peak effect max (h)')}
        {field('appetite_effect_window_min', 'Appetite window min (h)')}
        {field('appetite_effect_window_max', 'Appetite window max (h)')}
        {field('nausea_risk_window_min', 'Nausea window min (h)')}
        {field('nausea_risk_window_max', 'Nausea window max (h)')}
        {field('constipation_risk_window_min', 'Constipation window min (h)')}
        {field('constipation_risk_window_max', 'Constipation window max (h)')}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dc-notes">Notes</Label>
        <Textarea id="dc-notes" name="notes" rows={2} defaultValue={profile?.notes ?? ''} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</Button>
    </form>
  );
}

// ── 3. Symptom playbooks (+ bands) ─────────────────────────

export function SymptomPlaybooksTab({
  drugId, playbooks, bands, sideEffects,
}: {
  drugId: string;
  playbooks: Playbook[];
  bands: PlaybookBand[];
  sideEffects: SideEffectLite[];
}) {
  const [pbError, addPlaybook, pbPending] = useAddAction(addSymptomPlaybook);
  const [bandError, addBand, bandPending] = useAddAction(addSymptomPlaybookBand);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {playbooks.map((pb) => {
        const pbBands = bands.filter((b) => b.playbook_id === pb.id).sort((a, b) => a.ordinal - b.ordinal);
        return (
          <div key={pb.id} className="rounded-[--radius] border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{pb.symptom}</p>
              <DeleteButton onClick={() => startTransition(() => deleteSymptomPlaybook(pb.id, drugId))} />
            </div>

            {pbBands.map((b) => (
              <div key={b.id} className="rounded border border-border p-2 text-sm flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {b.title}{' '}
                    <span className="text-muted-foreground font-normal">
                      (score {b.min_score ?? '?'}–{b.max_score ?? '?'})
                    </span>
                  </p>
                  {b.nutrition_strategy.length > 0 && <><span className="text-xs text-muted-foreground">Nutrition:</span><ArrayPills items={b.nutrition_strategy} /></>}
                  {b.hydration_strategy.length > 0 && <><span className="text-xs text-muted-foreground">Hydration:</span><ArrayPills items={b.hydration_strategy} /></>}
                  {b.avoid.length > 0 && <><span className="text-xs text-muted-foreground">Avoid:</span><ArrayPills items={b.avoid} /></>}
                  {b.escalation && <p className="text-xs text-muted-foreground mt-1">⚠ {b.escalation}</p>}
                </div>
                <DeleteButton onClick={() => startTransition(() => deleteSymptomPlaybookBand(b.id, drugId))} />
              </div>
            ))}

            <form action={addBand} className="space-y-3 border-t pt-3">
              <input type="hidden" name="drug_id" value={drugId} />
              <input type="hidden" name="playbook_id" value={pb.id} />
              <FormError error={bandError} />
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Band title</Label>
                  <Input name="title" placeholder="Mild nausea" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Min score</Label>
                  <Input name="min_score" type="number" step="1" min="0" max="10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Max score</Label>
                  <Input name="max_score" type="number" step="1" min="0" max="10" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Nutrition (1/line)</Label>
                  <Textarea name="nutrition_strategy" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hydration (1/line)</Label>
                  <Textarea name="hydration_strategy" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Avoid (1/line)</Label>
                  <Textarea name="avoid" rows={2} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Escalation (optional)</Label>
                <Input name="escalation" placeholder="When to seek help" />
              </div>
              <Button type="submit" size="sm" variant="outline" disabled={bandPending}>
                {bandPending ? 'Adding…' : 'Add band'}
              </Button>
            </form>
          </div>
        );
      })}

      <form action={addPlaybook} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add symptom playbook</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={pbError} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pb-symptom">Symptom</Label>
            <Input id="pb-symptom" name="symptom" placeholder="Nausea" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pb-se">Link side effect (optional)</Label>
            <select name="side_effect_id" id="pb-se" className={selectClass()}>
              <option value="">— none —</option>
              {sideEffects.map((s) => <option key={s.id} value={s.id}>{s.effect}</option>)}
            </select>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={pbPending}>{pbPending ? 'Adding…' : 'Add playbook'}</Button>
      </form>
    </div>
  );
}

// ── 4. Food tolerance rules ────────────────────────────────

export function FoodToleranceTab({ drugId, rules }: { drugId: string; rules: FoodRule[] }) {
  const [error, formAction, pending] = useAddAction(addFoodToleranceRule);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className="flex items-start gap-3 rounded-[--radius] border p-3">
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="mb-1">{r.context}</Badge>
              {r.prefer.length > 0 && <><span className="text-xs text-muted-foreground">Prefer:</span><ArrayPills items={r.prefer} /></>}
              {r.limit.length > 0 && <><span className="text-xs text-muted-foreground">Limit:</span><ArrayPills items={r.limit} /></>}
              {r.avoid.length > 0 && <><span className="text-xs text-muted-foreground">Avoid:</span><ArrayPills items={r.avoid} /></>}
              {r.rationale && <p className="text-xs text-muted-foreground mt-1">{r.rationale}</p>}
            </div>
            <DeleteButton onClick={() => startTransition(() => deleteFoodToleranceRule(r.id, drugId))} />
          </div>
        ))}
      </div>

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add food tolerance rule</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="space-y-1.5">
          <Label htmlFor="ft-context">Context</Label>
          <select name="context" id="ft-context" className={selectClass()}>
            {FOOD_CONTEXTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label>Prefer (1/line)</Label>
            <Textarea name="prefer" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Limit (1/line)</Label>
            <Textarea name="limit" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Avoid (1/line)</Label>
            <Textarea name="avoid" rows={3} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ft-rationale">Rationale</Label>
          <Input id="ft-rationale" name="rationale" />
        </div>
        <Button type="submit" size="sm" disabled={pending}>{pending ? 'Adding…' : 'Add rule'}</Button>
      </form>
    </div>
  );
}

// ── 5. Check-in protocol ───────────────────────────────────

export function CheckinTab({
  drugId, protocol, questions,
}: {
  drugId: string;
  protocol: CheckinProtocol | null;
  questions: CheckinQuestion[];
}) {
  const [pError, saveProtocol, pPending] = useAddAction(saveCheckinProtocol);
  const [qError, addQuestion, qPending] = useAddAction(addCheckinQuestion);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <form action={saveProtocol} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Check-in protocol (one per drug)</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={pError} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ci-cadence">Cadence</Label>
            <Input id="ci-cadence" name="cadence" placeholder="dose_day_plus_2" defaultValue={protocol?.cadence ?? ''} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-notes">Notes</Label>
            <Input id="ci-notes" name="notes" defaultValue={protocol?.notes ?? ''} />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={pPending}>{pPending ? 'Saving…' : 'Save protocol'}</Button>
      </form>

      {protocol && (
        <>
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-[--radius] border p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{q.label} <span className="text-muted-foreground font-normal">· {q.type}{q.unit ? ` (${q.unit})` : ''}</span></p>
                  <p className="text-xs text-muted-foreground">
                    id: {q.question_id}
                    {q.condition && ` · ${q.condition}`}
                    {q.trigger_guidance_from_score != null && ` · trigger ≥ ${q.trigger_guidance_from_score}`}
                  </p>
                </div>
                <DeleteButton onClick={() => startTransition(() => deleteCheckinQuestion(q.id, drugId))} />
              </div>
            ))}
          </div>

          <form action={addQuestion} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
            <p className="text-sm font-medium">Add check-in question</p>
            <input type="hidden" name="drug_id" value={drugId} />
            <input type="hidden" name="protocol_id" value={protocol.id} />
            <FormError error={qError} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Question id</Label>
                <Input name="question_id" placeholder="nausea_0_10" required />
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input name="label" placeholder="Nausea" required />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Input name="type" placeholder="scale_0_10" required />
              </div>
              <div className="space-y-1.5">
                <Label>Unit (optional)</Label>
                <Input name="unit" placeholder="L" />
              </div>
              <div className="space-y-1.5">
                <Label>Condition (optional)</Label>
                <Input name="condition" placeholder="if_constipation_or_nausea" />
              </div>
              <div className="space-y-1.5">
                <Label>Trigger from score (optional)</Label>
                <Input name="trigger_guidance_from_score" type="number" step="1" />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={qPending}>{qPending ? 'Adding…' : 'Add question'}</Button>
          </form>
        </>
      )}
    </div>
  );
}

// ── 6. Red-flag rules ──────────────────────────────────────

export function RedFlagRulesTab({ drugId, rules }: { drugId: string; rules: RedFlagRule[] }) {
  const [error, formAction, pending] = useAddAction(addRedFlagRule);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className="flex items-start gap-3 rounded-[--radius] border p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {r.symptom} <Badge variant="destructive" className="ml-1">{r.action_level}</Badge>
              </p>
              <p className="text-xs text-muted-foreground">{r.display_copy}</p>
              <ArrayPills items={r.related_risks} />
            </div>
            <DeleteButton onClick={() => startTransition(() => deleteRedFlagRule(r.id, drugId))} />
          </div>
        ))}
      </div>

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add red-flag rule</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rf-symptom">Symptom</Label>
            <Input id="rf-symptom" name="symptom" placeholder="Severe abdominal pain" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rf-action">Action level</Label>
            <select name="action_level" id="rf-action" className={selectClass()}>
              {ACTION_LEVELS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rf-copy">Display copy</Label>
          <Textarea id="rf-copy" name="display_copy" rows={2} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rf-risks">Related risks (1/line)</Label>
          <Textarea id="rf-risks" name="related_risks" rows={2} placeholder="pancreatitis" />
        </div>
        <Button type="submit" size="sm" disabled={pending}>{pending ? 'Adding…' : 'Add rule'}</Button>
      </form>
    </div>
  );
}

// ── 7. Clinician report template (1:1) ─────────────────────

export function ClinicianReportTab({ drugId, template }: { drugId: string; template: ClinicianReport | null }) {
  const [error, formAction, pending] = useAddAction(saveClinicianReportTemplate);

  return (
    <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
      <p className="text-sm font-medium">Clinician report template (one per drug)</p>
      <input type="hidden" name="drug_id" value={drugId} />
      <FormError error={error} />
      <div className="space-y-1.5">
        <Label htmlFor="cr-km">Key metrics (1/line)</Label>
        <Textarea id="cr-km" name="key_metrics" rows={3} defaultValue={(template?.key_metrics ?? []).join('\n')} placeholder={'dose_adherence\nweight_change'} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cr-rs">Relevant symptoms (1/line)</Label>
        <Textarea id="cr-rs" name="relevant_symptoms" rows={3} defaultValue={(template?.relevant_symptoms ?? []).join('\n')} placeholder={'nausea\nconstipation'} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cr-label">Medication context label</Label>
        <Input id="cr-label" name="medication_context_label" defaultValue={template?.medication_context_label ?? ''} placeholder="GLP-1 receptor agonist" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>{pending ? 'Saving…' : 'Save template'}</Button>
    </form>
  );
}
