import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildGeneralWhatsAppLink } from '../lib/whatsapp';

/** Raccourci WhatsApp sur ordinateur. Sur téléphone, le bouton de l'en-tête suffit et l'écran reste libre. */
export const FloatingWhatsApp: React.FC = () => {
  const { settings, lang, tr } = useStore();
  const link = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });

  return (
    <a
      href={link}
      onClick={() => track('contact')}
      target="_blank"
      rel="noopener noreferrer"
      className="hidden md:flex fixed z-40 right-6 bottom-6 w-14 h-14 rounded-full bg-wa-deep hover:bg-velvet text-white items-center justify-center shadow-lg"
      aria-label={tr('Discuter sur WhatsApp', 'Chat on WhatsApp')}
    >
      <MessageCircle className="w-7 h-7 fill-current" aria-hidden="true" />
    </a>
  );
};
