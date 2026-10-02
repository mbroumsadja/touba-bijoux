import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const noContent = () => new NextResponse(null, { status: 204 });

const MAX_BODY_CHARS = 5_000_000; // équivalent du `limit: '5mb'` d'Express

export async function readJson(req: Request): Promise<Record<string, unknown>> {
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
