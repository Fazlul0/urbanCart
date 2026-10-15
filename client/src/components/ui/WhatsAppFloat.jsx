import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const WHATSAPP_URL =
  'https://wa.me/8801862234253?text=' +
  encodeURIComponent('Hi! I would like to know more about your products.');

const WhatsAppFloat = () => {
  const { pathname } = useLocation();
  // Product page has sticky Cart/Buy bar above the footer — keep chat clear of it
  const onProduct =
    pathname.startsWith('/products/') && pathname !== '/products/';

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat on WhatsApp"
      className={`fixed z-50 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all duration-200 right-3 sm:right-6 sm:bottom-14 ${
        onProduct
          ? 'bottom-[12.5rem]'
          : 'bottom-[7.5rem]'
      }`}
    >
      <MessageCircle size={20} className="sm:hidden" fill="currentColor" strokeWidth={1.5} />
      <MessageCircle size={26} className="hidden sm:block" fill="currentColor" strokeWidth={1.5} />
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 pointer-events-none" />
    </a>
  );
};

export default WhatsAppFloat;
