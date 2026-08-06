import { MessageCircle } from 'lucide-react';

const WHATSAPP_URL =
  'https://wa.me/8801700000000?text=' +
  encodeURIComponent('Hi! I would like to know more about your products.');

const WhatsAppFloat = () => (
  <a
    href={WHATSAPP_URL}
    target="_blank"
    rel="noreferrer"
    aria-label="Chat with us on WhatsApp"
    title="Chat on WhatsApp"
    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all duration-200"
  >
    <MessageCircle size={26} fill="currentColor" strokeWidth={1.5} />
    <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />
  </a>
);

export default WhatsAppFloat;
