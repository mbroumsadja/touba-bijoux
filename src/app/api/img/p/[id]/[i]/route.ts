import { verifySignature } from '@/server/auth';
import { imageVersion } from '@/server/catalog';
import { collections } from '@/server/db';
import { handle } from '@/server/http';
import { serveImage } from '@/server/images';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string; i: string }> };

const notFound = () => new Response('Not found', { status: 404 });

export const GET = handle<Ctx>(async (req, { params }) => {
  const { id, i } = await params;
  const index = Number(i);
  if (!Number.isInteger(index) || index < 0 || index > 9) return notFound();
  const search = new URL(req.url).searchParams;

  const { products } = await collections();
  // 1) lecture minuscule (sans la photo) pour connaître la version et savoir si le produit est masqué
  const meta = await products.findOne({ id }, { projection: { _id: 0, hidden: 1, imgV: 1, createdAt: 1 } });
  if (!meta) return notFound();
  // Produit masqué : seul le gérant connaît la signature, ajoutée à ses liens par imageSignature().
  if (meta.hidden && !verifySignature(`img:${id}:${index}`, search.get('k'))) return notFound();

  return serveImage(req, {
    cacheKey: `p-${id}-${index}`,
    current: String(imageVersion(meta)),
    requested: search.get('v'),
    priv: Boolean(meta.hidden),
    // 2) la photo n'est lue que si elle n'est ni en mémoire ni déjà chez le visiteur
    load: async () => {
      const doc = await products.findOne({ id }, { projection: { _id: 0, images: { $slice: [index, 1] } } });
      const image = Array.isArray(doc?.images) ? doc.images[0] : undefined;
      return typeof image === 'string' ? image : undefined;
    },
  });
});
