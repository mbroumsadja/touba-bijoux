'use client';

import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { NewArrivals } from './components/NewArrivals';
import { ProductGrid } from './components/ProductGrid';
import { ArrivalsCTA } from './components/ArrivalsCTA';
import { PhotoModal } from './components/PhotoModal';
import { WholesaleSection } from './components/WholesaleSection';
import { ShopSection } from './components/ShopSection';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { ProductCategory } from './types';
import { useStore } from './lib/store';
import { useReveal } from './lib/useReveal';
import { track, trackVisitOnce } from './lib/analytics';

// L'espace gérant n'est téléchargé que par le gérant
const Manager = lazy(() => import('./manager/Manager').then((m) => ({ default: m.Manager })));

export default function App() {
  const { products, lang, settings } = useStore();
  const [activeSection, setActiveSection] = useState('accueil');
  const [category, setCategory] = useState('all');
  const [modal, setModal] = useState<{ ids: string[]; index: number } | null>(null);
  const [hash, setHash] = useState(() => window.location.hash);
  const managerRoute = hash === '#gerant' || hash.startsWith('#gerant/');

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (!managerRoute) trackVisitOnce();
  }, [managerRoute]);

  useReveal([products, category]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    document.title = `${settings.shopName} · ${lang === 'fr' ? 'Montres & bijoux pour femmes · Détail & gros' : "Women's watches & jewelry · Retail & wholesale"}`;
  }, [lang, settings.shopName]);

  // Met en surbrillance la section visible dans le menu
  useEffect(() => {
    const ids = ['accueil', 'catalogue', 'arrivages', 'gros', 'boutique'];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    if (id === 'accueil') window.scrollTo({ top: 0, behavior: 'smooth' });
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const pickCategory = (cat: string) => {
    if (cat !== 'all') track('category', { cat });
    setCategory(cat);
  };

  const showCategory = (cat: string) => {
    pickCategory(cat);
    requestAnimationFrame(() => scrollTo('catalogue'));
  };

  const open = useCallback((ids: string[], index: number) => setModal({ ids, index }), []);
  const close = useCallback(() => setModal(null), []);
  const step = useCallback(
    (delta: number) =>
      setModal((m) => (m ? { ...m, index: (m.index + delta + m.ids.length) % m.ids.length } : m)),
    [],
  );

  const current = modal ? products.find((p) => p.id === modal.ids[modal.index]) ?? null : null;

  if (managerRoute) {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-papier" />}>
        <Manager />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onNavigate={scrollTo} activeSection={activeSection} />
      <main className="flex-1">
        <Hero onSelectCategory={(c: ProductCategory) => showCategory(c)} onExploreCatalog={() => showCategory('all')} />
        <ProductGrid selectedCategory={category} onSelectCategory={pickCategory} onOpen={open} />
        <NewArrivals onOpen={open} onSeeAll={() => showCategory('all')} />
        <WholesaleSection />
        <ArrivalsCTA />
        <ShopSection />
      </main>
      <Footer onNavigate={scrollTo} onOpenAdmin={() => { window.location.hash = 'gerant'; }} />
      <FloatingWhatsApp />
      <PhotoModal product={current} hasMultiple={(modal?.ids.length ?? 0) > 1} onStep={step} onClose={close} />
    </div>
  );
}
