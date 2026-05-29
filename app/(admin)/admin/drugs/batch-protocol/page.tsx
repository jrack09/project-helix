import Link from 'next/link';
import { BatchProtocolRunner } from './batch-protocol-runner';

export default function BatchProtocolPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/admin/drugs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to drugs
        </Link>
        <h1 className="text-2xl font-bold mt-2">Batch generate protocol companion</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Runs the AI protocol-companion drafter (journey timeline, dose-cycle windows, symptom playbooks,
          food rules, check-in protocol, red-flag rules, clinician report) against every drug in the catalogue.
          Use <strong>Dry run</strong> first to preview what each drug would receive — then <strong>Apply</strong>.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Takes ~15-20 seconds per drug. The page will lock while running. <strong>Apply clean-replaces</strong>{' '}
          each drug&apos;s existing protocol blocks, so review afterwards. Errors on individual drugs do not abort
          the batch — they&apos;re reported in the results.
        </p>
      </div>

      <BatchProtocolRunner />
    </div>
  );
}
