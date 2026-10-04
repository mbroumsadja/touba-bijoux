import { collections } from '@/server/db';
import { handle } from '@/server/http';
import { IMAGE_SETTING_KEYS, serveImage } from '@/server/images';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ key: string }> };

export const GET = handle<Ctx>(async (req, { params }) => {
  const { key } = await params;
  if (!IMAGE_SETTING_KEYS.includes(key)) return new Response('Not found', { status: 404 });

  const { settings } = await collections();
  const version = `${key}V`;
  const meta = await settings.findOne({ _id: 'main' } as never, { projection: { _id: 0, [version]: 1 } });

  return serveImage(req, {
    cacheKey: `s-${key}`,
    current: String(meta?.[version] ?? 0),
    requested: new URL(req.url).searchParams.get('v'),
    priv: false,
    load: async () => {
      const doc = await settings.findOne({ _id: 'main' } as never, { projection: { _id: 0, [key]: 1 } });
      return typeof doc?.[key] === 'string' ? (doc[key] as string) : undefined;
    },
  });
});
