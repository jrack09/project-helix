'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createDrug } from '../../actions';

export default function NewDrugPage() {
  const [error, formAction, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try {
        await createDrug(formData);
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    },
    null,
  );

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">New drug</h1>
      <p className="text-sm text-muted-foreground">
        Create a draft entry. You'll fill in companion content on the edit page.
      </p>

      <form action={formAction} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" placeholder="e.g. Semaglutide (Wegovy)" required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug * <span className="text-muted-foreground font-normal">(lowercase, hyphens only)</span></Label>
          <Input id="slug" name="slug" placeholder="e.g. semaglutide-wegovy" required pattern="[a-z0-9-]+" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="drug_class">Drug class</Label>
          <Input id="drug_class" name="drug_class" placeholder="e.g. GLP-1 receptor agonist" />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create draft'}
        </Button>
      </form>
    </div>
  );
}
