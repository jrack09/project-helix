'use client';

import { useActionState, useTransition } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { Database } from '@/types/database';
import {
  saveDrugOverview,
  saveDrugPharmacokinetics,
  addExpectation, deleteExpectation,
  addFoodGuidance, deleteFoodGuidance,
  addTip, deleteTip,
  addWarning, deleteWarning, toggleWarningRedFlag,
  addInjectionSite, deleteInjectionSite,
  addSideEffectWindow, deleteSideEffectWindow,
  addOralAdministration, deleteOralAdministration,
  publishDrug, archiveDrug,
} from '../../../actions';

type Drug = Database['public']['Tables']['peptides']['Row'];
type Expectation = Database['public']['Tables']['drug_expectations']['Row'];
type FoodGuidance = Database['public']['Tables']['drug_food_guidance']['Row'];
type Tip = Database['public']['Tables']['drug_tips']['Row'];
type Warning = Database['public']['Tables']['drug_warnings']['Row'];
type InjectionSite = Database['public']['Tables']['drug_injection_sites']['Row'];
type SideEffectWindow = Database['public']['Tables']['drug_side_effect_windows']['Row'];
type OralAdministration = Database['public']['Tables']['drug_oral_administration']['Row'];
type SideEffectLite = { id: string; effect: string };

type Props = {
  drug: Drug;
  expectations: Expectation[];
  foodGuidance: FoodGuidance[];
  tips: Tip[];
  warnings: Warning[];
  injectionSites: InjectionSite[];
  sideEffectWindows: SideEffectWindow[];
  oralAdministration: OralAdministration[];
  sideEffects: SideEffectLite[];
};

function FormError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

function OverviewTab({ drug }: { drug: Drug }) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await saveDrugOverview(formData);
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    },
    null,
  );
  const [, startTransition] = useTransition();
  const isPublished = drug.publication_status === 'published';

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="id" value={drug.id} />
        <FormError error={error} />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" defaultValue={drug.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" name="slug" defaultValue={drug.slug} required pattern="[a-z0-9-]+" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="generic_name">Generic name</Label>
            <Input id="generic_name" name="generic_name" defaultValue={drug.generic_name ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="drug_class">Drug class</Label>
            <Input id="drug_class" name="drug_class" defaultValue={drug.drug_class ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand_names">Brand names (comma-separated)</Label>
            <Input
              id="brand_names"
              name="brand_names"
              defaultValue={Array.isArray(drug.brand_names) ? (drug.brand_names as string[]).join(', ') : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="administration_route">Route</Label>
            <Input id="administration_route" name="administration_route" defaultValue={drug.administration_route ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="evidence_score">Evidence score (0–100)</Label>
            <Input id="evidence_score" name="evidence_score" type="number" min={0} max={100} defaultValue={drug.evidence_score ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status_label">Status label</Label>
            <Input id="status_label" name="status_label" defaultValue={drug.status_label} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              defaultValue={drug.image_url ?? ''}
              placeholder="/drugs/semaglutide-wegovy.png"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="short_description">Short description</Label>
          <Textarea id="short_description" name="short_description" rows={2} defaultValue={drug.short_description ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mechanism_summary">Mechanism summary</Label>
          <Textarea id="mechanism_summary" name="mechanism_summary" rows={4} defaultValue={drug.mechanism_summary ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="typical_dosing_schedule">Typical dosing schedule (descriptive)</Label>
          <Textarea id="typical_dosing_schedule" name="typical_dosing_schedule" rows={2} defaultValue={drug.typical_dosing_schedule ?? ''} />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save overview'}
        </Button>
      </form>

      <div className="border-t pt-6 space-y-4">
        <div>
          <p className="text-sm font-medium">Publication</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Publishing runs a compliance check. Any blocked phrase will prevent publishing and show an error.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {!isPublished && (
            <Button
              type="button"
              onClick={() => startTransition(() => publishDrug(drug.id))}
              className="bg-success text-white hover:bg-success/90"
            >
              Publish drug
            </Button>
          )}
          {drug.publication_status !== 'archived' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => startTransition(() => archiveDrug(drug.id))}
            >
              Archive
            </Button>
          )}
          {isPublished && (
            <p className="text-sm text-muted-foreground">This drug is live and visible in the API.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpectationsTab({ drugId, expectations }: { drugId: string; expectations: Expectation[] }) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await addExpectation(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {expectations.length > 0 && (
        <div className="divide-y divide-border rounded-[--radius] border">
          {expectations.map((e) => (
            <div key={e.id} className="flex items-start gap-4 p-4">
              <div className="min-w-[56px]">
                <Badge variant="secondary">Wk {e.week_number}</Badge>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{e.milestone}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{e.description}</p>
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => deleteExpectation(e.id, drugId))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add expectation</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="week_number">Week</Label>
            <Input id="week_number" name="week_number" type="number" min={0} defaultValue={0} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="milestone">Milestone</Label>
            <Input id="milestone" name="milestone" placeholder="e.g. Initial dose" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} placeholder="What the user can expect this week" required />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </form>
    </div>
  );
}

function FoodGuidanceTab({ drugId, foodGuidance }: { drugId: string; foodGuidance: FoodGuidance[] }) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await addFoodGuidance(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );
  const [, startTransition] = useTransition();

  const grouped = (['prefer', 'limit', 'avoid', 'hydrate'] as const).reduce(
    (acc, cat) => ({ ...acc, [cat]: foodGuidance.filter((f) => f.category === cat) }),
    {} as Record<string, FoodGuidance[]>,
  );

  const CAT_LABEL = { prefer: '✅ Prefer', limit: '⚠️ Limit', avoid: '❌ Avoid', hydrate: '💧 Hydrate' };

  return (
    <div className="space-y-6">
      {(['prefer', 'limit', 'avoid', 'hydrate'] as const).filter((c) => grouped[c].length > 0).map((cat) => (
        <div key={cat}>
          <p className="text-sm font-semibold mb-2">{CAT_LABEL[cat]}</p>
          <div className="divide-y divide-border rounded-[--radius] border">
            {grouped[cat].map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{f.item}</p>
                  {f.rationale && <p className="text-xs text-muted-foreground">{f.rationale}</p>}
                </div>
                <Badge variant="outline">{f.evidence_level}</Badge>
                <button
                  type="button"
                  onClick={() => startTransition(() => deleteFoodGuidance(f.id, drugId))}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add food guidance</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fg-category">Category</Label>
            <select name="category" id="fg-category" className="flex h-9 w-full rounded-[--radius] border border-input bg-transparent px-3 py-1 text-sm">
              <option value="prefer">Prefer</option>
              <option value="limit">Limit</option>
              <option value="avoid">Avoid</option>
              <option value="hydrate">Hydrate</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fg-item">Item</Label>
            <Input id="fg-item" name="item" placeholder="e.g. Lean protein" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fg-rationale">Rationale (optional)</Label>
          <Input id="fg-rationale" name="rationale" placeholder="Brief reason" />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </form>
    </div>
  );
}

function TipsTab({ drugId, tips }: { drugId: string; tips: Tip[] }) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await addTip(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );
  const [, startTransition] = useTransition();

  const TIP_CATEGORIES = ['administration', 'timing', 'mindset', 'exercise', 'sleep', 'hydration', 'nutrition', 'other'] as const;

  return (
    <div className="space-y-6">
      {tips.length > 0 && (
        <div className="divide-y divide-border rounded-[--radius] border">
          {tips.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-4">
              <Badge variant="outline" className="mt-0.5 shrink-0">{t.category}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{t.body_markdown}</p>
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => deleteTip(t.id, drugId))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add tip</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tip-category">Category</Label>
            <select name="category" id="tip-category" className="flex h-9 w-full rounded-[--radius] border border-input bg-transparent px-3 py-1 text-sm">
              {TIP_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tip-title">Title</Label>
            <Input id="tip-title" name="title" placeholder="e.g. Stay hydrated" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tip-body">Body (markdown supported)</Label>
          <Textarea id="tip-body" name="body_markdown" rows={4} placeholder="Tip content…" required />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </form>
    </div>
  );
}


function ClinicalTab({ drug }: { drug: Drug }) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await saveDrugPharmacokinetics(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <input type="hidden" name="id" value={drug.id} />
      <FormError error={error} />
      <p className="text-sm text-muted-foreground">
        Numeric pharmacokinetic values exposed via the API alongside the free-text <code>pharmacokinetics</code> JSON.
        Leave blank if not characterised (e.g. investigational peptides).
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="half_life_hours">Half-life (hours)</Label>
          <Input
            id="half_life_hours" name="half_life_hours" type="number" step="0.1" min={0}
            defaultValue={drug.half_life_hours ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tmax_hours">Tmax (hours)</Label>
          <Input
            id="tmax_hours" name="tmax_hours" type="number" step="0.1" min={0}
            defaultValue={drug.tmax_hours ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="duration_of_action_hours">Duration of action (hours)</Label>
          <Input
            id="duration_of_action_hours" name="duration_of_action_hours" type="number" step="0.1" min={0}
            defaultValue={drug.duration_of_action_hours ?? ''}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save pharmacokinetics'}
      </Button>
    </form>
  );
}

function WarningsTab({ drugId, warnings }: { drugId: string; warnings: Warning[] }) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await addWarning(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );
  const [, startTransition] = useTransition();

  const SEVERITY_VARIANT: Record<string, 'secondary' | 'warning' | 'destructive'> = {
    info: 'secondary', caution: 'warning', urgent: 'destructive', boxed_warning: 'destructive',
  };

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="divide-y divide-border rounded-[--radius] border">
          {warnings.map((w) => (
            <div key={w.id} className="flex items-start gap-3 p-4">
              <Badge variant={SEVERITY_VARIANT[w.severity] ?? 'secondary'} className="mt-0.5 shrink-0">
                {w.severity}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{w.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{w.body}</p>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={w.is_red_flag}
                  onChange={(e) => startTransition(() => toggleWarningRedFlag(w.id, drugId, e.target.checked))}
                />
                Red flag
              </label>
              <button
                type="button"
                onClick={() => startTransition(() => deleteWarning(w.id, drugId))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add warning</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="w-severity">Severity</Label>
            <select name="severity" id="w-severity" className="flex h-9 w-full rounded-[--radius] border border-input bg-transparent px-3 py-1 text-sm">
              <option value="info">info</option>
              <option value="caution">caution</option>
              <option value="urgent">urgent</option>
              <option value="boxed_warning">boxed warning</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-title">Title</Label>
            <Input id="w-title" name="title" required placeholder="e.g. Pancreatitis symptoms" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-body">Body</Label>
          <Textarea id="w-body" name="body" rows={3} required />
        </div>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="is_red_flag" value="true" />
          Mark as red-flag symptom (surfaces in <code>red_flag_symptoms</code>)
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add warning'}
        </Button>
      </form>
    </div>
  );
}

function InjectionSitesTab({ drugId, sites }: { drugId: string; sites: InjectionSite[] }) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await addInjectionSite(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );
  const [, startTransition] = useTransition();

  const SITE_LABEL: Record<string, string> = {
    abdomen: 'Abdomen', thigh: 'Thigh', upper_arm: 'Upper arm', buttock: 'Buttock', other: 'Other',
  };

  return (
    <div className="space-y-6">
      {sites.length > 0 && (
        <div className="divide-y divide-border rounded-[--radius] border">
          {sites.map((s) => (
            <div key={s.id} className="flex items-start gap-3 p-4">
              <div className="min-w-[110px]">
                <Badge variant={s.preferred ? 'success' : 'outline'}>
                  {SITE_LABEL[s.site] ?? s.site}{s.preferred ? ' • preferred' : ''}
                </Badge>
              </div>
              <div className="flex-1 min-w-0 text-sm">
                {s.rotation_guidance && <p>{s.rotation_guidance}</p>}
                {s.avoid_notes && <p className="text-muted-foreground mt-0.5">Avoid: {s.avoid_notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => deleteInjectionSite(s.id, drugId))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add injection site</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="is-site">Site</Label>
            <select name="site" id="is-site" className="flex h-9 w-full rounded-[--radius] border border-input bg-transparent px-3 py-1 text-sm">
              <option value="abdomen">Abdomen</option>
              <option value="thigh">Thigh</option>
              <option value="upper_arm">Upper arm</option>
              <option value="buttock">Buttock</option>
              <option value="other">Other</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-sm self-end pb-1.5">
            <input type="checkbox" name="preferred" value="true" />
            Preferred site
          </label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="is-rotation">Rotation guidance</Label>
          <Textarea id="is-rotation" name="rotation_guidance" rows={2} placeholder="e.g. Rotate weekly across abdomen, thigh and upper arm." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="is-avoid">Avoid notes</Label>
          <Input id="is-avoid" name="avoid_notes" placeholder="e.g. Skin that is bruised, tender, scarred." />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add site'}
        </Button>
      </form>
    </div>
  );
}

function SideEffectWindowsTab({
  drugId, windows, sideEffects,
}: {
  drugId: string; windows: SideEffectWindow[]; sideEffects: SideEffectLite[];
}) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await addSideEffectWindow(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );
  const [, startTransition] = useTransition();

  const fmtRange = (lo: number | null, hi: number | null, unit: string) => {
    if (lo == null && hi == null) return '—';
    if (lo != null && hi != null) return `${lo}–${hi} ${unit}`;
    return `${lo ?? hi} ${unit}`;
  };

  return (
    <div className="space-y-6">
      {windows.length > 0 && (
        <div className="divide-y divide-border rounded-[--radius] border">
          {windows.map((w) => (
            <div key={w.id} className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium">{w.effect}</p>
                <p className="text-muted-foreground mt-0.5">
                  Onset {fmtRange(w.onset_hours_min, w.onset_hours_max, 'h')} ·
                  Peak {fmtRange(w.peak_hours_min, w.peak_hours_max, 'h')} ·
                  Resolves {w.resolution_days_typical != null ? `~${w.resolution_days_typical}d` : '—'}
                </p>
                {w.notes && <p className="text-muted-foreground mt-1">{w.notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => deleteSideEffectWindow(w.id, drugId))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add side-effect window</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sew-effect">Effect</Label>
            <Input id="sew-effect" name="effect" required placeholder="e.g. Nausea" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sew-link">Link to side_effects row (optional)</Label>
            <select name="side_effect_id" id="sew-link" className="flex h-9 w-full rounded-[--radius] border border-input bg-transparent px-3 py-1 text-sm">
              <option value="">— none —</option>
              {sideEffects.map((s) => (
                <option key={s.id} value={s.id}>{s.effect}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sew-onset-min">Onset min (h)</Label>
            <Input id="sew-onset-min" name="onset_hours_min" type="number" step="0.1" min={0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sew-onset-max">Onset max (h)</Label>
            <Input id="sew-onset-max" name="onset_hours_max" type="number" step="0.1" min={0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sew-peak-min">Peak min (h)</Label>
            <Input id="sew-peak-min" name="peak_hours_min" type="number" step="0.1" min={0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sew-peak-max">Peak max (h)</Label>
            <Input id="sew-peak-max" name="peak_hours_max" type="number" step="0.1" min={0} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sew-res">Typical resolution (days)</Label>
            <Input id="sew-res" name="resolution_days_typical" type="number" step="0.1" min={0} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sew-notes">Notes</Label>
          <Textarea id="sew-notes" name="notes" rows={2} />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add window'}
        </Button>
      </form>
    </div>
  );
}

function OralAdministrationTab({
  drugId, items,
}: {
  drugId: string; items: OralAdministration[];
}) {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await addOralAdministration(formData); return null; }
      catch (e) { return (e as Error).message; }
    },
    null,
  );
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <div className="divide-y divide-border rounded-[--radius] border">
          {items.map((o) => (
            <div key={o.id} className="flex items-start gap-3 p-4">
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium">{o.formulation}{o.swallow_whole ? ' · swallow whole' : ''}</p>
                <p className="text-muted-foreground mt-0.5">
                  {o.with_water_ml != null && <>With {o.with_water_ml} mL water · </>}
                  {o.time_of_day && <>{o.time_of_day} · </>}
                  {(o.fasting_window_before_min != null || o.fasting_window_after_min != null) && (
                    <>Fast {o.fasting_window_before_min ?? 0}m before / {o.fasting_window_after_min ?? 0}m after</>
                  )}
                </p>
                {o.interaction_notes && <p className="text-muted-foreground mt-1">{o.interaction_notes}</p>}
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => deleteOralAdministration(o.id, drugId))}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="space-y-4 border rounded-[--radius] p-4 bg-muted/30">
        <p className="text-sm font-medium">Add oral administration instruction</p>
        <input type="hidden" name="drug_id" value={drugId} />
        <FormError error={error} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="oa-form">Formulation</Label>
            <Input id="oa-form" name="formulation" required placeholder="e.g. oral tablet" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oa-time">Time of day</Label>
            <Input id="oa-time" name="time_of_day" placeholder="e.g. first thing in the morning" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="oa-water">With water (mL)</Label>
            <Input id="oa-water" name="with_water_ml" type="number" min={0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oa-fast-before">Fast before (min)</Label>
            <Input id="oa-fast-before" name="fasting_window_before_min" type="number" min={0} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oa-fast-after">Fast after (min)</Label>
            <Input id="oa-fast-after" name="fasting_window_after_min" type="number" min={0} />
          </div>
        </div>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="swallow_whole" value="true" />
          Swallow whole (do not crush or split)
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="oa-int">Interaction notes</Label>
          <Textarea id="oa-int" name="interaction_notes" rows={2} placeholder="e.g. Separate from levothyroxine by ≥4 hours." />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </form>
    </div>
  );
}


export function DrugEditTabs({
  drug, expectations, foodGuidance, tips,
  warnings, injectionSites, sideEffectWindows, oralAdministration, sideEffects,
}: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="clinical">Clinical PK</TabsTrigger>
        <TabsTrigger value="warnings">
          Warnings {warnings.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{warnings.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="injection-sites">
          Injection sites {injectionSites.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{injectionSites.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="se-windows">
          SE windows {sideEffectWindows.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{sideEffectWindows.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="oral">
          Oral {oralAdministration.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{oralAdministration.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="expectations">
          Expectations {expectations.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{expectations.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="food">
          Food {foodGuidance.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{foodGuidance.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="tips">
          Tips {tips.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{tips.length}</Badge>}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><OverviewTab drug={drug} /></TabsContent>
      <TabsContent value="clinical"><ClinicalTab drug={drug} /></TabsContent>
      <TabsContent value="warnings"><WarningsTab drugId={drug.id} warnings={warnings} /></TabsContent>
      <TabsContent value="injection-sites"><InjectionSitesTab drugId={drug.id} sites={injectionSites} /></TabsContent>
      <TabsContent value="se-windows"><SideEffectWindowsTab drugId={drug.id} windows={sideEffectWindows} sideEffects={sideEffects} /></TabsContent>
      <TabsContent value="oral"><OralAdministrationTab drugId={drug.id} items={oralAdministration} /></TabsContent>
      <TabsContent value="expectations"><ExpectationsTab drugId={drug.id} expectations={expectations} /></TabsContent>
      <TabsContent value="food"><FoodGuidanceTab drugId={drug.id} foodGuidance={foodGuidance} /></TabsContent>
      <TabsContent value="tips"><TipsTab drugId={drug.id} tips={tips} /></TabsContent>
    </Tabs>
  );
}
