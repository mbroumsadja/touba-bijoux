import type { Metadata, Viewport } from 'next';
// Polices de la boutique hébergées avec le site : pas de requête externe, affichage plus rapide sur mobile.
import '@fontsource-variable/syne';
import '@fontsource-variable/instrument-sans';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { siteUrl } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'TOUBA BIJOUX · Montres & bijoux pour femmes · Détail & gros',
  description:
    'TOUBA BIJOUX : montres et bijoux pour femmes, vendus au détail et en gros (prix de gros sur chaque produit). Livraison dans tout le Cameroun. Commandez en un clic sur WhatsApp.',
  applicationName: 'TOUBA BIJOUX',
  keywords: [
    'bijoux femme Cameroun',
    'montres femme Garoua',
    'bijoux en gros Cameroun',
    'colliers',
    'bracelets',
    'bagues',
    'boucles d\'oreilles',
    'TOUBA BIJOUX',
  ],
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: 'TOUBA BIJOUX · Montres & bijoux',
    description: 'Détail et gros, livraison dans tout le Cameroun. Photo, prix, commande sur WhatsApp.',
    type: 'website',
    url: '/',
    siteName: 'TOUBA BIJOUX',
    locale: 'fr_CM',
    images: ['/images/og.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TOUBA BIJOUX · Montres & bijoux',
    description: 'Détail et gros, livraison dans tout le Cameroun. Commande sur WhatsApp.',
    images: ['/images/og.jpg'],
  },
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
  '@id': `${siteUrl}/#boutique`,
  url: `${siteUrl}/`,
  name: 'TOUBA BIJOUX',
  image: `${siteUrl}/images/og.jpg`,
  logo: `${siteUrl}/icons/icon-512.png`,
  inLanguage: 'fr',
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" as="image" href="/images/hero.webp" fetchPriority="high" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
