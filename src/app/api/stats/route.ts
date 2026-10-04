import { requireAdmin } from '@/server/auth';
import { listEvents } from '@/server/events';
import { handle, respondJson } from '@/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handle(async (req) => {
  requireAdmin(req);
  return respondJson(req, JSON.stringify(await listEvents(req.url)), { 'Cache-Control': 'private, no-store' });
});
