import React from 'react';
import { BellRing, ArrowRight, MessageCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { buildGeneralWhatsAppLink } from '../lib/whatsapp';

export const ArrivalsCTA: React.FC = () => {
  const { settings, lang, tr } = useStore();
  const whatsapp = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });

  return (
    <section className="bg-sand border-y border-onyx/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
        <div className="rounded-[2rem] bg-onyx text-ivory p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
                <BellRing className="h-3.5 w-3.5" />
                {tr('Arrivages', 'New arrivals')}
              </span>
              <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-medium leading-tight">
                {tr('Vous cherchez un modèle précis ?', 'Looking for a specific piece?')}
              </h2>
              <p className="mt-3 max-w-xl text-ivory/75 text-base">
                {tr('Contactez-nous pour être prévenu dès qu’un nouvel arrivage ou un modèle similaire arrive en boutique.', 'Contact us to be notified as soon as a new arrival or a similar model arrives in the shop.')}
              </p>
            </div>

            <div className="rounded-3xl border border-ivory/10 bg-ivory/5 p-5 sm:p-6">
              <div className="flex items-center gap-3 text-gold">
                <MessageCircle className="h-5 w-5 fill-current" />
                <span className="text-sm uppercase tracking-[0.2em]">WhatsApp</span>
              </div>
              <p className="mt-4 text-ivory/80 text-sm sm:text-base">
                {tr('Dites-nous le modèle que vous voulez, nous vous tiendrons informé dès son arrivée.', 'Tell us the model you want, and we will keep you informed as soon as it arrives.')}
              </p>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-onyx transition-colors hover:bg-ivory"
              >
                {tr('Contacter la boutique', 'Contact the shop')}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
