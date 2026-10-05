import React from 'react';
import { Phone, MessageCircle, Navigation } from 'lucide-react';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildGeneralWhatsAppLink, sanitizePhone } from '../lib/whatsapp';
import { IMG } from '../lib/initialData';

export const ShopSection: React.FC = () => {
  const { settings, lang, tr } = useStore();
  const whatsapp = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });
  const address = (lang === 'en' && settings.addressEn) || settings.addressFr;
  const hours = (lang === 'en' && settings.openingHoursEn) || settings.openingHoursFr;

  const rows = [
    { label: tr('Adresse', 'Address'), value: address },
    { label: tr('Horaires', 'Opening hours'), value: hours },
    { label: tr('Téléphone et WhatsApp', 'Phone and WhatsApp'), value: settings.displayPhone },
  ];

  return (
    <section id="boutique">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="aspect-[4/3] bg-mist overflow-hidden">
          <img src={settings.shopPhoto || IMG.hero} alt={tr('La boutique', 'The shop')} loading="lazy" width={800} height={600} className="w-full h-full object-cover" />
        </div>

        <div>
          <h2 className="text-[2rem] sm:text-5xl lg:text-6xl font-bold">{tr('Venez nous voir', 'Come and visit')}</h2>
          <dl className="mt-8 border-t border-velvet/25">
            {rows.map(({ label, value }) => (
              <div key={label} className="py-4 border-b border-velvet/25">
                <dt className="text-sm text-moss">{label}</dt>
                <dd className="mt-0.5 text-lg">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            <a href={whatsapp} onClick={() => track('contact')} target="_blank" rel="noopener noreferrer" className="h-12 rounded-sm bg-velvet hover:bg-velvet-deep text-white font-semibold inline-flex items-center justify-center gap-2">
              <MessageCircle className="w-[18px] h-[18px] fill-current" aria-hidden="true" /> WhatsApp
            </a>
            <a href={`tel:+${sanitizePhone(settings.whatsappNumber)}`} className="h-12 rounded-sm border border-velvet hover:bg-velvet hover:text-white font-semibold inline-flex items-center justify-center gap-2">
              <Phone className="w-[18px] h-[18px]" aria-hidden="true" /> {tr('Appeler', 'Call')}
            </a>
            <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="h-12 rounded-sm border border-velvet hover:bg-velvet hover:text-white font-semibold inline-flex items-center justify-center gap-2">
              <Navigation className="w-[18px] h-[18px]" aria-hidden="true" /> {tr('Itinéraire', 'Directions')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
