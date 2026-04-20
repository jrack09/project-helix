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
  addExpectation, deleteExpectation,
  addFoodGuidance, deleteFoodGuidance,
  addTip, deleteTip,
  publishDrug, archiveDrug,
} from '../../../actions';

type Drug = Database['public']['Tables']['peptides']['Row'];
type Expectation = Database['public']['Tables']['drug_expectations']['Row'];
type FoodGuidance = Database['public']['Tables']['drug_food_guidance']['Row'];
type Tip = Database['public']['Tables']['drug_tips']['Row'];

type Props = {
  drug: Drug;
  expectations: Expectation[];
  foodGuidance: FoodGuidance[];
  tips: Tip[];
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

  return (
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

function PublishTab({ drug }: { drug: Drug }) {
  const [, startTransition] = useTransition();
  const isPublished = drug.publication_status === 'published';

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <AlertDescription>
          Publishing runs a compliance check across all text fields. Any blocked phrase will prevent publishing and show an error here.
          The publish action writes a content review record and audit log entry.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        {!isPublished && (
          <Button
            onClick={() => startTransition(() => publishDrug(drug.id))}
            className="bg-success text-white hover:bg-success/90"
          >
            Publish drug
          </Button>
        )}
        {drug.publication_status !== 'archived' && (
          <Button
            variant="outline"
            onClick={() => startTransition(() => archiveDrug(drug.id))}
          >
            Archive
          </Button>
        )}
        {isPublished && (
          <p className="text-sm text-muted-foreground self-center">
            This drug is live and visible in the API.
          </p>
        )}
      </div>
    </div>
  );
}

export function DrugEditTabs({ drug, expectations, foodGuidance, tips }: Props) {
  return (
    <Tabs defaultValue="overview">
      <TabsList className="mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="expectations">
          Expectations {expectations.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{expectations.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="food">
          Food {foodGuidance.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{foodGuidance.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="tips">
          Tips {tips.length > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{tips.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="publish">Publish</TabsTrigger>
      </TabsList>

      <TabsContent value="overview"><OverviewTab drug={drug} /></TabsContent>
      <TabsContent value="expectations"><ExpectationsTab drugId={drug.id} expectations={expectations} /></TabsContent>
      <TabsContent value="food"><FoodGuidanceTab drugId={drug.id} foodGuidance={foodGuidance} /></TabsContent>
      <TabsContent value="tips"><TipsTab drugId={drug.id} tips={tips} /></TabsContent>
      <TabsContent value="publish"><PublishTab drug={drug} /></TabsContent>
    </Tabs>
  );
}
