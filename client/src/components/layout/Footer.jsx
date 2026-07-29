import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Mail, MapPin } from 'lucide-react';
import Logo from '../ui/Logo';
import FacebookIcon from '../ui/FacebookIcon';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-black text-white mt-auto">
      <div className="container-uc px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="[&_span]:text-white [&_.text-brand-gold]:text-brand-gold">
              <Logo link={false} />
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Premium men's accessories curated for the modern gentleman. Watches, wallets, car
              accessories and more — delivered across Bangladesh.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-brand-black transition"
                aria-label="Facebook"
              >
                <FacebookIcon size={18} />
              </a>
              <a
                href="https://wa.me/8801700000000"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-gold hover:text-brand-black transition"
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg text-brand-gold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              {[
                ['/', 'Home'],
                ['/products', 'Shop All'],
                ['/about', 'About Us'],
                ['/contact', 'Contact'],
                ['/login', 'Login'],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-brand-gold transition">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg text-brand-gold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              {['Watches', 'Wallets', 'Car Accessories', 'Sunglasses', 'Belts'].map((c) => (
                <li key={c}>
                  <Link to="/products" className="hover:text-brand-gold transition">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg text-brand-gold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-brand-gold mt-0.5 shrink-0" />
                <a href="tel:+8801700000000" className="hover:text-brand-gold">
                  +880 1700-000000
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-brand-gold mt-0.5 shrink-0" />
                <a href="mailto:hello@urbancart.com" className="hover:text-brand-gold">
                  hello@urbancart.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-brand-gold mt-0.5 shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle size={16} className="text-brand-gold mt-0.5 shrink-0" />
                <a
                  href="https://m.me/urbancart"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-brand-gold"
                >
                  Messenger
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-uc px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <p>© {year} UrbanCart. All rights reserved.</p>
          <p>Cash on Delivery · Fast Delivery · Premium Quality</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
