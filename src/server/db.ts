import { MongoClient, type Db, type Document } from 'mongodb';
import { hashPassword } from './auth';
import { SEED_PRODUCTS, SEED_SETTINGS } from './seed';

export const NO_ID = { projection: { _id: 0 } };

export async function seedIfEmpty(db: Db): Promise<boolean> {
  const settings = db.collection<Document>('settings');
  if (await settings.findOne({ _id: 'main' } as Document, { projection: { _id: 1 } })) return false;
  const initialPassword = process.env.ADMIN_PASSWORD || 'touba2026';
  await settings.insertOne({ _id: 'main', ...SEED_SETTINGS, passwordHash: await hashPassword(initialPassword) } as Document);
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
      const client = new MongoClient(uri, {
        maxPoolSize: 10, // suffisant pour une boutique ; évite d'ouvrir jusqu'à 100 connexions TLS
        minPoolSize: 1, // garde une connexion chaude : la première requête après une pause n'attend plus la poignée de main TLS
        maxIdleTimeMS: 5 * 60_000,
        connectTimeoutMS: 8_000,
        serverSelectionTimeoutMS: 8_000, // échoue vite (message d'erreur) au lieu d'attendre 30 s si Mongo est injoignable
      });
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || 'touba-bijoux');
      // Index et amorçage en parallèle (avant : 4 allers-retours l'un après l'autre à chaque démarrage).
      const [, , , seeded] = await Promise.all([
        db.collection('products').createIndex({ id: 1 }, { unique: true }),
        db.collection('products').createIndex({ createdAt: -1 }), // tri du catalogue sans passer par la mémoire
        db.collection('events').createIndex({ t: -1 }),
        seedIfEmpty(db),
      ]);
      if (seeded) console.log('[touba] Base initialisée avec les produits d’exemple.');
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
