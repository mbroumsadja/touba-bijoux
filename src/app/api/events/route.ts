import { after } from 'next/server';
import { rateLimited, requireAdmin } from '@/server/auth';
import { collections } from '@/server/db';
import { listEvents, trimEvents } from '@/server/events';
import { clientIp, handle, json, readJson, respondJson } from '@/server/http';
import { EVENT_TYPES } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handle(async (req) => {
  requireAdmin(req);
  return respondJson(req, JSON.stringify(await listEvents(req.url)), { 'Cache-Control': 'private, no-store' });
});

export const POST = handle(async (req) => {
  // Filet anti-abus généreux (nombreuses clientes derrière une même adresse mobile) ; ignoré sans en-tête proxy.
  const ip = clientIp(req);
  if (ip !== 'x' && rateLimited('events', ip, 600, 60_000)) return json({ ok: false }, 429);

  const body = await readJson(req);
  const type = typeof body.type === 'string' ? body.type : '';
  if (!EVENT_TYPES.includes(type)) {
    return json({ ok: false }, 400);
  }

  const event = {
    t: Date.now(),
    type,
    ...(typeof body.pid === 'string' && body.pid ? { pid: body.pid.slice(0, 120) } : {}),
    ...(typeof body.cat === 'string' && body.cat ? { cat: body.cat.slice(0, 80) } : {}),
  };

  const { events } = await collections();
  await events.insertOne(event as Record<string, unknown>);
  after(trimEvents); // le nettoyage ne retarde plus la réponse

  return json({ ok: true });
});

export const DELETE = handle(async (req) => {
  requireAdmin(req);
  const { events } = await collections();
  await events.deleteMany({});
  return json({ ok: true });
});
