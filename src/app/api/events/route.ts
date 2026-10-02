import { requireAdmin } from '@/server/auth';
import { collections } from '@/server/db';
import { handle, json, readJson } from '@/server/http';
import { EVENT_TYPES, MAX_EVENTS_SENT } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handle(async (req) => {
  requireAdmin(req);
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get('days') ?? '30');
  const { events } = await collections();
  const since = Number.isFinite(days) && days > 0 ? Date.now() - days * 86_400_000 : undefined;
  const query = since ? { t: { $gte: since } } : {};
  const list = await events.find(query).sort({ t: -1 }).limit(MAX_EVENTS_SENT).toArray();
  return json({ events: list, truncated: list.length >= MAX_EVENTS_SENT });
});

export const POST = handle(async (req) => {
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

  const total = await events.countDocuments();
  if (total > MAX_EVENTS_SENT) {
    const old = await events.find({}).sort({ t: 1 }).limit(total - MAX_EVENTS_SENT).toArray();
    if (old.length) {
      await events.deleteMany({ _id: { $in: old.map((row) => row._id) } });
    }
  }

  return json({ ok: true });
});

export const DELETE = handle(async (req) => {
  requireAdmin(req);
  const { events } = await collections();
  await events.deleteMany({});
  return json({ ok: true });
});
