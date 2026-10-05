import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildGeneralWhatsAppLink } from '../lib/whatsapp';

export const ArrivalsCTA: React.FC = () => {
  const { settings, lang, tr } = useStore();
  const whatsapp = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });

  return (
    <section className="bg-brass text-velvet">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
        <h2 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold max-w-[16ch]">
          {tr('Vous cherchez un modèle précis ?', 'Looking for a specific piece?')}
        </h2>
        <div>
          <p className="text-lg max-w-[42ch]">
            {tr(
              'Dites-nous lequel sur WhatsApp. Nous vous prévenons dès qu’il arrive en boutique.',
              'Tell us which one on WhatsApp. We will let you know as soon as it reaches the shop.',
            )}
          </p>
          <a
            href={whatsapp}
            onClick={() => track('contact')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-sm bg-velvet px-7 font-semibold text-white hover:bg-velvet-deep"
          >
            <MessageCircle className="h-[18px] w-[18px] fill-current" aria-hidden="true" />
            {tr('Écrire à la boutique', 'Message the shop')}
          </a>
        </div>
      </div>
    </section>
  );
};
