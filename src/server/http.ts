import { gzip } from 'node:zlib';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

export const gzipAsync = promisify(gzip);

export class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const noContent = () => new NextResponse(null, { status: 204 });

/**
 * Réponse JSON compressée en gzip quand le navigateur l'accepte (Next.js ne compresse pas les réponses des routes API :
 * le catalogue et les statistiques partaient en clair). `gz` permet de réutiliser une version déjà compressée (cache).
 */
export async function respondJson(req: Request, body: string, headers: Record<string, string> = {}, gz?: Buffer): Promise<Response> {
  const base = { 'Content-Type': 'application/json; charset=utf-8', ...headers };
  if (body.length > 1024 && /\bgzip\b/i.test(req.headers.get('accept-encoding') ?? '')) {
    const packed = gz ?? (await gzipAsync(body));
    return new Response(new Uint8Array(packed), {
      headers: {
        ...base,
        Vary: [headers.Vary, 'Accept-Encoding'].filter(Boolean).join(', '),
        'Content-Encoding': 'gzip',
        'Content-Length': String(packed.length),
      },
    });
  }
  return new Response(body, { headers: base });
}

const MAX_BODY_CHARS = 5_000_000; // équivalent du `limit: '5mb'` d'Express

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  // Refus immédiat d'un corps manifestement énorme, avant de le charger en mémoire (UTF-8 : 4 octets/caractère au maximum).
  const declared = Number(req.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_CHARS * 4) throw new HttpError('Photos trop lourdes.', 413);
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) throw new HttpError('Photos trop lourdes.', 413);
  if (!text.trim()) return {};
  try {
    const data = JSON.parse(text);
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  } catch {
    throw new HttpError('Requête invalide.', 400);
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'x';
}

/** Enveloppe une route : transforme les erreurs en réponses JSON propres. */
export function handle<C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error('[touba]', e);
      return json({ error: 'Erreur du serveur.' }, 500);
    }
  };
}
