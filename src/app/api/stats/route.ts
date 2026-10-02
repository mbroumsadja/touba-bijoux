import { requireAdmin } from '@/server/auth';
import { collections } from '@/server/db';
import { handle, json } from '@/server/http';
import { MAX_EVENTS_SENT } from '@/server/validate';

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
