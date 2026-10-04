import { MessageCircle } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/8801862234253?text=' +
  encodeURIComponent('Hi! I would like to know more about your products.');

const WhatsAppFloat = () => (
  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noreferrer"
    aria-label="Chat with us on WhatsApp"
    title="Chat on WhatsApp"
    className="fixed bottom-[7.5rem] sm:bottom-14 right-3 sm:right-6 z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all duration-200"
  >
    <MessageCircle size={20} className="sm:hidden" fill="currentColor" strokeWidth={1.5} />
    <MessageCircle size={26} className="hidden sm:block" fill="currentColor" strokeWidth={1.5} />
    <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />
  </a>
);

export default WhatsAppFloat;
