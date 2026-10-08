import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

// Le site tient sur une seule page (les sections sont des ancres #, l'espace gérant est sur /#gerant) :
// une seule adresse à indexer.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteUrl}/`, changeFrequency: 'weekly', priority: 1 }];
}
