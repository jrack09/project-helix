import { NextResponse } from 'next/server';
import { resolveApiKeyFromHeader, type ResolvedApiKey } from '@/lib/api-keys/resolve';

type CorsHeaders = Record<string, string>;

function buildCorsHeaders(requestOrigin: string | null): CorsHeaders {
  const allowed = (process.env.VIORA_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const origin =
    allowed.length === 0 || (requestOrigin && allowed.includes(requestOrigin))
      ? (requestOrigin ?? '*')
      : allowed[0];

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export function corsHeaders(requestOrigin: string | null): CorsHeaders {
  return buildCorsHeaders(requestOrigin);
}

/** Handle OPTIONS preflight */
export function handleOptions(request: Request): NextResponse {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

/**
 * Resolve and validate the API key from the Authorization header.
 * Returns the resolved key, or a NextResponse error to return immediately.
 */
export async function resolveKey(
  request: Request,
): Promise<{ key: ResolvedApiKey; error?: never } | { key?: never; error: NextResponse }> {
  const origin = request.headers.get('origin');
  const headers = buildCorsHeaders(origin);

  let key: ResolvedApiKey | null;
  try {
    key = await resolveApiKeyFromHeader(request.headers.get('authorization'));
  } catch (e) {
    if (e instanceof Error && e.message === 'rate_limited') {
      return {
        error: NextResponse.json(
          { error: 'Rate limit exceeded. Please retry shortly.' },
          { status: 429, headers },
        ),
      };
    }
    throw e;
  }

  if (!key) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized. Provide a valid Bearer API key.' },
        { status: 401, headers },
      ),
    };
  }

  return { key };
}
