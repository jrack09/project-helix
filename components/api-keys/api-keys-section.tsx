'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ApiKeyRow = {
  id: string;
  key_prefix: string;
  name: string | null;
  created_at: string;
  revoked_at: string | null;
};

export default function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [createLoading, setCreateLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch('/api/api-keys', { credentials: 'include' });
      const data = (await res.json()) as { keys?: ApiKeyRow[]; error?: string };
      if (!res.ok) {
        setListError(data.error ?? 'Failed to load API keys');
        return;
      }
      setKeys(data.keys ?? []);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  async function generate() {
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/api-keys', { method: 'POST', credentials: 'include' });
      const data = (await res.json()) as { api_key?: string; error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? 'Failed to create API key');
        return;
      }
      if (data.api_key) {
        setNewKey(data.api_key);
      }
      await loadKeys();
    } finally {
      setCreateLoading(false);
    }
  }

  async function copy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function revoke(id: string) {
    if (
      !window.confirm(
        'Revoke this API key? Apps using it will stop working immediately. This cannot be undone.',
      )
    ) {
      return;
    }
    setRevokingId(id);
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setListError(data.error ?? 'Failed to revoke API key');
        return;
      }
      await loadKeys();
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-4 pt-1">
      <div>
        <p className="text-sm font-medium">API access</p>
        <p className="text-sm text-muted-foreground">
          Use active keys as <code className="text-xs bg-muted px-1 py-0.5 rounded">Authorization: Bearer …</code> for
          programmatic requests. Only the prefix is shown for existing keys; the secret is never stored.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={generate} disabled={createLoading}>
          {createLoading ? 'Generating…' : 'Generate API key'}
        </Button>
      </div>

      {createError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{createError}</AlertDescription>
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

      <div className="space-y-2">
        <p className="text-sm font-medium">Your API keys</p>
        {listError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{listError}</AlertDescription>
          </Alert>
        )}
        {listLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((k) => {
                const active = !k.revoked_at;
                return (
                  <TableRow key={k.id}>
                    <TableCell>
                      <code className="text-xs">{k.key_prefix}_…</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{k.name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(k.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {active ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={revokingId !== null}
                          onClick={() => revoke(k.id)}
                        >
                          {revokingId === k.id ? 'Revoking…' : 'Revoke'}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
