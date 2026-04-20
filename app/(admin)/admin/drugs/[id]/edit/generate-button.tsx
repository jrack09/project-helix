'use client';

import { useActionState } from 'react';
import { generateDrugContentAction, clearAndRegenerateDrugContent } from '../../../actions';
import { Button } from '@/components/ui/button';

export function GenerateContentButton({ drugId, hasContent }: { drugId: string; hasContent: boolean }) {
  const action = hasContent ? clearAndRegenerateDrugContent : generateDrugContentAction;

  const [error, formAction, pending] = useActionState(async (_: unknown, formData: FormData) => {
    try {
      await action(formData.get('drug_id') as string);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, null);

  return (
    <div className={`rounded-lg border border-dashed p-4 flex items-center justify-between gap-4 ${hasContent ? 'border-border bg-transparent' : 'border-border bg-muted/30'}`}>
      <div>
        {hasContent ? (
          <>
            <p className="text-sm font-medium">Regenerate AI content</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clears all existing expectations, food guidance, and tips and generates a fresh draft. This cannot be undone.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">No companion content yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate a first draft with AI — expectations, food guidance, and tips. Takes ~20 seconds.
            </p>
          </>
        )}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <form action={formAction}>
        <input type="hidden" name="drug_id" value={drugId} />
        <Button
          type="submit"
          variant={hasContent ? 'outline' : 'outline'}
          size="sm"
          disabled={pending}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Generating…
            </span>
          ) : hasContent ? (
            '↺ Regenerate'
          ) : (
            '✦ Generate AI draft'
          )}
        </Button>
      </form>
    </div>
  );
}
