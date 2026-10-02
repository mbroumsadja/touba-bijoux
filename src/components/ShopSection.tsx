import React from 'react';
import { MapPin, Clock, Phone, MessageCircle, Navigation } from 'lucide-react';
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
    { icon: MapPin, label: tr('Adresse', 'Address'), value: address },
    { icon: Clock, label: tr('Horaires', 'Opening hours'), value: hours },
    { icon: Phone, label: tr('Téléphone & WhatsApp', 'Phone & WhatsApp'), value: settings.displayPhone },
  ];

  return (
    <section id="boutique" className="bg-sand border-t border-onyx/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="reveal rounded-3xl overflow-hidden aspect-[4/3] bg-ivory">
          <img src={settings.shopPhoto || IMG.hero} alt={tr('La boutique', 'The shop')} loading="lazy" className="w-full h-full object-cover" />
        </div>

        <div className="reveal">
          <h2 className="font-serif text-3xl sm:text-5xl font-medium leading-tight">{tr('Venez nous voir', 'Come and visit')}</h2>
          <span className="gold-rule mt-4" />
          <ul className="mt-8 space-y-5">
            {rows.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex gap-4">
                <span className="w-10 h-10 shrink-0 rounded-full bg-ivory flex items-center justify-center text-gold-deep">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-widest text-onyx/50">{label}</span>
                  <span className="block mt-0.5 text-[17px]">{value}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            <a href={whatsapp} onClick={() => track('contact')} target="_blank" rel="noopener noreferrer" className="h-12 rounded-full bg-wa-deep hover:bg-onyx text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors">
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
            </a>
            <a href={`tel:+${sanitizePhone(settings.whatsappNumber)}`} className="h-12 rounded-full bg-onyx hover:bg-onyx/80 text-ivory text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors">
              <Phone className="w-4 h-4" /> {tr('Appeler', 'Call')}
            </a>
            <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="h-12 rounded-full border border-onyx/25 hover:bg-ivory text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors">
              <Navigation className="w-4 h-4" /> {tr('Itinéraire', 'Directions')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
