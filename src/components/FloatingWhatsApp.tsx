import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../lib/store';
import { track } from '../lib/analytics';
import { buildGeneralWhatsAppLink } from '../lib/whatsapp';

export const FloatingWhatsApp: React.FC = () => {
  const { settings, lang, tr } = useStore();
  const link = buildGeneralWhatsAppLink({ phone: settings.whatsappNumber, shopName: settings.shopName, lang });

  return (
    <a
      href={link}
      onClick={() => track('contact')}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-float fixed z-40 right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] w-14 h-14 rounded-full bg-wa text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
      aria-label={tr('Discuter sur WhatsApp', 'Chat on WhatsApp')}
    >
      <MessageCircle className="w-7 h-7 fill-current" />
    </a>
  );
};
