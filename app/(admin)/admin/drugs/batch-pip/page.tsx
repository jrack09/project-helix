import Link from 'next/link';
import { BatchPipRunner } from './batch-pip-runner';

export default function BatchPipPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/admin/drugs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to drugs
        </Link>
        <h1 className="text-2xl font-bold mt-2">Batch draft PIP fields</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Runs the AI PIP-extension drafter against every drug in the catalogue and inserts only entries
          that don't already exist. Use <strong>Dry run</strong> first to preview the catalogue-wide delta
          without writing — then <strong>Apply</strong> when the counts look right.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Takes ~15-20 seconds per drug. The page will lock while running. Errors on individual drugs
          do not abort the batch — they're reported in the results.
        </p>
      </div>

      <BatchPipRunner />
    </div>
  );
}
