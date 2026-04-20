'use client';

import { useActionState } from 'react';
import { saveGuide, publishGuide, archiveGuide } from '../../../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type Guide = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  body_markdown: string;
  category: string;
  cover_emoji: string | null;
  ordinal: number;
  publication_status: string;
};

export function GuideEditForm({ guide }: { guide: Guide }) {
  const [saveError, saveAction, savePending] = useActionState(async (_: unknown, formData: FormData) => {
    try { await saveGuide(formData); return null; }
    catch (e) { return (e as Error).message; }
  }, null);

  const [publishError, publishAction, publishPending] = useActionState(async (_: unknown, formData: FormData) => {
    try { await publishGuide(formData.get('guide_id') as string); return null; }
    catch (e) { return (e as Error).message; }
  }, null);

  const [archiveError, archiveAction, archivePending] = useActionState(async (_: unknown, formData: FormData) => {
    try { await archiveGuide(formData.get('guide_id') as string); return null; }
    catch (e) { return (e as Error).message; }
  }, null);

  const isPublished = guide.publication_status === 'published';

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Save form */}
      <form action={saveAction} className="space-y-5 rounded-lg border border-border p-6">
        <h2 className="text-base font-semibold">Content</h2>
        {saveError && <p className="text-sm text-destructive">{saveError}</p>}

        <input type="hidden" name="id" value={guide.id} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={guide.title} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" defaultValue={guide.slug} required pattern="[a-z0-9-]+" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input id="subtitle" name="subtitle" defaultValue={guide.subtitle ?? ''} placeholder="One-line description shown on the guide card" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue={guide.category}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="getting_started">Getting started</option>
              <option value="administration">Administration</option>
              <option value="nutrition">Nutrition</option>
              <option value="side_effects">Side effects</option>
              <option value="lifestyle">Lifestyle</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cover_emoji">Cover emoji</Label>
            <Input id="cover_emoji" name="cover_emoji" defaultValue={guide.cover_emoji ?? ''} placeholder="💊" maxLength={4} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ordinal">Display order</Label>
            <Input id="ordinal" name="ordinal" type="number" defaultValue={guide.ordinal} min={0} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="body_markdown">Body (Markdown)</Label>
          <Textarea
            id="body_markdown"
            name="body_markdown"
            defaultValue={guide.body_markdown}
            rows={20}
            placeholder="Write the guide content in Markdown..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Supports standard Markdown: headings, bold, lists, links.</p>
        </div>

        <Button type="submit" disabled={savePending}>
          {savePending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      {/* Publish / Archive */}
      <div className="rounded-lg border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold">Publication</h2>

        {publishError && <p className="text-sm text-destructive">{publishError}</p>}
        {archiveError && <p className="text-sm text-destructive">{archiveError}</p>}

        <p className="text-sm text-muted-foreground">
          Publishing runs a compliance check and makes the guide visible on the public site and Viora API.
        </p>

        <div className="flex gap-3">
          {!isPublished && (
            <form action={publishAction}>
              <input type="hidden" name="guide_id" value={guide.id} />
              <Button type="submit" disabled={publishPending}>
                {publishPending ? 'Publishing…' : 'Publish guide'}
              </Button>
            </form>
          )}
          {guide.publication_status !== 'archived' && (
            <form action={archiveAction}>
              <input type="hidden" name="guide_id" value={guide.id} />
              <Button type="submit" variant="outline" disabled={archivePending}>
                {archivePending ? 'Archiving…' : 'Archive'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
