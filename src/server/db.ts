import { MongoClient, type Db, type Document } from 'mongodb';
import { hashPassword } from './auth';
import { SEED_PRODUCTS, SEED_SETTINGS } from './seed';

export const NO_ID = { projection: { _id: 0 } };

export async function seedIfEmpty(db: Db): Promise<boolean> {
  const settings = db.collection<Document>('settings');
  if (await settings.findOne({ _id: 'main' } as Document)) return false;
  const initialPassword = process.env.ADMIN_PASSWORD || 'touba2026';
  await settings.insertOne({ _id: 'main', ...SEED_SETTINGS, passwordHash: hashPassword(initialPassword) } as Document);
  const products = db.collection<Document>('products');
  if ((await products.countDocuments()) === 0) {
    const now = Date.now();
    await products.insertMany(SEED_PRODUCTS.map((p, i) => ({ ...p, createdAt: now - i })));
  }
  return true;
}

// Une seule connexion réutilisée (important en dev avec le rechargement à chaud et en serverless).
const g = globalThis as unknown as { _toubaDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g._toubaDb) {
    const uri = process.env.MONGODB_URI;
    if (!uri) return Promise.reject(new Error('MONGODB_URI manquant : copiez .env.example vers .env.local.'));
    g._toubaDb = (async () => {
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || 'touba-bijoux');
      await db.collection('products').createIndex({ id: 1 }, { unique: true });
      await db.collection('events').createIndex({ t: -1 });
      if (await seedIfEmpty(db)) console.log('[touba] Base initialisée avec les produits d’exemple.');
      return db;
    })().catch((e) => {
      g._toubaDb = undefined; // permet de réessayer à la requête suivante
      throw e;
    });
  }
  return g._toubaDb;
}

export const collections = async () => {
  const db = await getDb();
  return {
    products: db.collection<Document>('products'),
    settings: db.collection<Document>('settings'),
    events: db.collection<Document>('events'),
  };
};
