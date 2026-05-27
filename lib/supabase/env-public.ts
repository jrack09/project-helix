/**
 * Next.js only loads `.env`, `.env.local`, `.env.development`, etc. — not `.env.example`.
 * `NEXT_PUBLIC_*` vars are required for client + server Supabase helpers.
 */
export function getSupabasePublicEnv(): { url: string; anonKey: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL and anon key are missing. Copy `.env.example` to `.env.local` (Next.js does not load `.env.example`), set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart `npm run dev`.'
    );
  }

  return { url, anonKey };
}
