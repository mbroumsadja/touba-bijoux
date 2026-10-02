import { collections, NO_ID } from '@/server/db';
import { isAdminRequest } from '@/server/auth';
import { handle, json } from '@/server/http';
import { publicSettings, withoutCreatedAt } from '@/server/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handle(async (req) => {
  const { products, settings } = await collections();
  const admin = isAdminRequest(req);
  const list = await products.find(admin ? {} : { hidden: { $ne: true } }, NO_ID).sort({ createdAt: -1 }).toArray();
  const doc = await settings.findOne({ _id: 'main' } as never);
  return json({ products: list.map(withoutCreatedAt), settings: publicSettings(doc) });
});
