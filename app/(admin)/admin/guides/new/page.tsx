'use client';

import { useActionState } from 'react';
import { createGuide } from '../../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function NewGuidePage() {
  const [error, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    try {
      await createGuide(formData);
    } catch (e) {
      return (e as Error).message;
    }
  }, null);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">New guide</h1>

      <form action={action} className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="e.g. What is a GLP-1 medication?"
            required
            onChange={(e) => {
              const slugInput = document.getElementById('slug') as HTMLInputElement;
              if (slugInput && !slugInput.dataset.edited) {
                slugInput.value = slugify(e.target.value);
              }
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            placeholder="what-is-a-glp1-medication"
            required
            pattern="[a-z0-9-]+"
            onChange={(e) => { e.target.dataset.edited = 'true'; }}
          />
          <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens only.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
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

        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create guide'}
        </Button>
      </form>
    </div>
  );
}
