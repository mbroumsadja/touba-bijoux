import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/syne';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'TOUBA BIJOUX · Montres & bijoux pour femmes · Détail & gros',
  description:
    'TOUBA BIJOUX : montres et bijoux pour femmes, vendus au détail et en gros (prix de gros sur chaque produit). Livraison dans tout le Cameroun. Commandez en un clic sur WhatsApp.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
  openGraph: {
    title: 'TOUBA BIJOUX · Montres & bijoux',
    description: 'Détail et gros, livraison dans tout le Cameroun. Photo, prix, commande sur WhatsApp.',
    type: 'website',
    images: ['/images/og.jpg'],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B3B2E',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: 'TOUBA BIJOUX',
  description:
    'Montres et bijoux pour femmes, vente au détail et en gros, livraison dans tout le Cameroun, commande directe sur WhatsApp.',
  areaServed: { '@type': 'Country', name: 'Cameroun' },
  address: { '@type': 'PostalAddress', addressLocality: 'Garoua', addressCountry: 'CM' },
  currenciesAccepted: 'XAF',
  paymentAccepted: 'Orange Money, MTN Mobile Money, Paiement à la livraison',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/images/hero.webp" fetchPriority="high" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
