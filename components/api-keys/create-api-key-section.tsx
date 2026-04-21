'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CreateApiKeySection() {
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/api-keys', { method: 'POST', credentials: 'include' });
      const data = (await res.json()) as { api_key?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to create API key');
        return;
      }
      if (data.api_key) {
        setNewKey(data.api_key);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 pt-1">
      <div>
        <p className="text-sm font-medium">API access</p>
        <p className="text-sm text-muted-foreground">
          Use the key as <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization: Bearer …</code> for
          programmatic requests.
        </p>
      </div>
      <Button type="button" onClick={generate} disabled={loading}>
        {loading ? 'Generating…' : 'Generate API key'}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {newKey && (
        <Alert variant="warning">
          <AlertTitle>Save your key now</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>This key is shown only once. Store it securely.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="block max-w-full flex-1 overflow-x-auto rounded border bg-muted px-3 py-2 text-xs">
                {newKey}
              </code>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={copy}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
