import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Truck,
  Banknote,
  BadgeCheck,
  MessageCircle,
  Phone,
  Check,
  CreditCard,
  ShoppingBag,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  getCategories,
  getHeroImages,
  getMembershipSettings,
} from '../services/api';
import FacebookIcon from '../components/ui/FacebookIcon';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatBDT } from '../utils/helpers';

const HERO_INTERVAL_MS = 5000;

const whyUs = [
  { icon: Shield, title: 'Premium Quality', desc: 'Curated accessories built to last' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Quick shipping across Bangladesh' },
  { icon: Banknote, title: 'Cash On Delivery', desc: 'Pay when you receive your order' },
  { icon: BadgeCheck, title: 'Trusted Products', desc: 'Genuine items, honest reviews' },
];

const Home = () => {
  const { siteName, logoUrl } = useSiteSettings();
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();
  const [categories, setCategories] = useState([]);
  const [membership, setMembership] = useState(null);
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  const brandParts = (siteName || 'UrbanCart').trim().split(/\s+/);
  const brandLast = brandParts.length > 1 ? brandParts.pop() : null;
  const brandFirst = brandParts.length ? brandParts.join(' ') : siteName || 'UrbanCart';
  const initials = (siteName || 'UC')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    Promise.all([
      getCategories({ type: 'general' }),
      getHeroImages().catch(() => ({ data: { images: [] } })),
      getMembershipSettings().catch(() => null),
    ])
      .then(([catRes, heroRes, memRes]) => {
        setCategories(catRes.data.categories || []);
        setMembership(memRes?.data?.settings || null);
        const slides = (heroRes.data.images || []).map((img) => ({
          url: img.url,
          alt: img.alt || siteName,
          position: img.position || 'center center',
        }));
        setHeroImages(slides);
        setHeroIndex(0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteName]);

  useEffect(() => {
    heroImages.forEach((img) => {
      if (!img.url) return;
      const preload = new Image();
      preload.src = img.url;
    });
  }, [heroImages]);

  useEffect(() => {
    if (heroImages.length <= 1) return undefined;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [heroImages]);

  const features = (membership?.features || []).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{siteName} — Premium Men's Accessories</title>
      </Helmet>

      {/* Utility icons (replaces navbar on home) */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-5 z-50 flex items-center gap-1">
        <Link
          to="/membership"
          className="p-2 rounded-full bg-black/35 text-white backdrop-blur hover:bg-brand-gold hover:text-brand-black transition"
          aria-label="Membership"
        >
          <CreditCard size={16} />
        </Link>
        <Link
          to="/cart"
          className="relative p-2 rounded-full bg-black/35 text-white backdrop-blur hover:bg-brand-gold hover:text-brand-black transition"
          aria-label="Cart"
        >
          <ShoppingBag size={16} />
          {cart.itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 bg-brand-gold text-brand-black text-[9px] font-bold rounded-full flex items-center justify-center">
              {cart.itemCount > 9 ? '9+' : cart.itemCount}
            </span>
          )}
        </Link>
        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="p-2 rounded-full bg-black/35 text-white backdrop-blur hover:bg-brand-gold hover:text-brand-black transition"
            aria-label="Account"
          >
            <User size={16} />
          </Link>
        ) : (
          <Link
            to="/login"
            className="ml-0.5 text-xs font-medium px-3 py-1.5 rounded-full bg-brand-gold text-brand-black hover:bg-brand-gold-light transition"
          >
            Login
          </Link>
        )}
      </div>

      {/* Short hero — brand name + icon only */}
      <section className="relative h-[22svh] min-h-[140px] max-h-[180px] sm:h-[20svh] sm:max-h-[200px] flex items-center overflow-hidden bg-brand-black">
        {heroImages.length > 0 && (
          <AnimatePresence mode="sync">
            <motion.div
              key={heroIndex}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <img
                src={heroImages[heroIndex]?.url}
                alt={heroImages[heroIndex]?.alt || siteName}
                className="w-full h-full object-cover"
                style={{ objectPosition: heroImages[heroIndex]?.position || 'center center' }}
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div className={`absolute inset-0 ${heroImages.length ? 'bg-brand-black/55' : 'bg-gradient-to-br from-neutral-900 via-brand-black to-neutral-950'}`} />

        <div className="relative container-uc w-full px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-2.5 sm:gap-3"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-contain shrink-0 bg-white/10"
              />
            ) : (
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-brand-gold text-brand-black flex items-center justify-center font-display font-bold text-xs sm:text-sm shrink-0">
                {initials}
              </div>
            )}
            <h1 className="font-display text-[clamp(1.75rem,6vw,2.75rem)] leading-none text-white tracking-tight">
              {brandLast ? (
                <>
                  {brandFirst}
                  <span className="text-brand-gold"> {brandLast}</span>
                </>
              ) : (
                <>
                  {brandFirst.slice(0, Math.ceil(brandFirst.length / 2))}
                  <span className="text-brand-gold">
                    {brandFirst.slice(Math.ceil(brandFirst.length / 2))}
                  </span>
                </>
              )}
            </h1>
          </motion.div>
        </div>

        {heroImages.length > 1 && (
          <div className="absolute bottom-2.5 right-3 sm:right-6 z-10 flex items-center gap-1">
            {heroImages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setHeroIndex(i)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === heroIndex ? 'w-5 bg-brand-gold' : 'w-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* First screen: membership + categories + products */}
      <section className="bg-[#f7f6f4] pt-3 pb-6 sm:pt-4 sm:pb-8">
        <div className="container-uc px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
          {/* Membership */}
          {membership && (
            <div>
              <div className="flex items-end justify-between gap-3 mb-2.5">
                <div>
                  <p className="text-brand-gold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5">
                    Membership
                  </p>
                  <h2 className="font-display text-lg sm:text-xl text-brand-black">
                    {membership.title || 'Membership Card'}
                  </h2>
                </div>
                <Link
                  to="/membership"
                  className="text-xs sm:text-sm font-medium text-brand-black/70 hover:text-brand-gold inline-flex items-center gap-1 shrink-0"
                >
                  View details <ArrowRight size={14} />
                </Link>
              </div>
              <Link
                to="/membership"
                className="block relative overflow-hidden rounded-xl bg-brand-black text-white"
              >
                <div className="relative min-h-[96px] sm:min-h-[110px] flex">
                  {membership.cardImage && (
                    <img
                      src={membership.cardImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                  )}
                  <div className="relative z-10 flex-1 p-3.5 sm:p-4 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-brand-gold text-[10px] tracking-widest uppercase flex items-center gap-1">
                          <CreditCard size={12} /> Member card
                        </p>
                        <p className="font-semibold text-sm sm:text-base mt-0.5 line-clamp-1">
                          {membership.title}
                        </p>
                      </div>
                      <p className="text-brand-gold text-sm font-semibold shrink-0">
                        {formatBDT(membership.fee || 0)}
                      </p>
                    </div>
                    {features.length > 0 && (
                      <ul className="flex flex-wrap gap-x-3 gap-y-1">
                        {features.map((f) => (
                          <li
                            key={f}
                            className="flex items-center gap-1 text-[11px] sm:text-xs text-white/80"
                          >
                            <Check size={12} className="text-brand-gold shrink-0" />
                            <span className="line-clamp-1">{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* All categories */}
          <div>
            <div className="mb-2.5">
              <p className="text-brand-gold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5">
                Collections
              </p>
              <h2 className="font-display text-lg sm:text-xl text-brand-black">Categories</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-neutral-200 animate-pulse" />
                ))
              ) : categories.length === 0 ? (
                <p className="col-span-2 sm:col-span-3 lg:col-span-4 text-sm text-brand-muted py-6 text-center rounded-xl border border-dashed border-brand-border">
                  No categories yet — add them from the admin panel.
                </p>
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/products?category=${cat._id}`}
                    className="group relative block aspect-[4/3] rounded-xl overflow-hidden bg-neutral-200"
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/75 via-brand-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                      <h3 className="font-display text-sm sm:text-base text-white group-hover:text-brand-gold transition line-clamp-1">
                        {cat.name}
                      </h3>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad !py-12 sm:!py-16">
        <div className="container-uc">
          <div className="text-center mb-10">
            <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Why {siteName}</p>
            <h2 className="font-display text-3xl md:text-4xl text-brand-black">Why Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-4"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-gold/15 flex items-center justify-center text-brand-gold">
                  <item.icon size={24} />
                </div>
                <h3 className="font-display text-lg mb-1">{item.title}</h3>
                <p className="text-brand-muted text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad !py-12 sm:!py-16">
        <div className="container-uc max-w-2xl">
          <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">About Us</p>
          <h2 className="font-display text-3xl md:text-4xl mb-5">Crafted for Modern Men</h2>
          <p className="text-brand-muted leading-relaxed mb-6">
            {siteName} is your destination for premium men's accessories in Bangladesh. From
            precision watches to refined wallets and stylish car upgrades — we curate products
            that blend quality, design, and everyday utility.
          </p>
          <Link to="/about" className="btn-dark">
            Learn More <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="section-pad !py-12 sm:!py-16 bg-white">
        <div className="container-uc text-center">
          <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Get In Touch</p>
          <h2 className="font-display text-3xl md:text-4xl mb-4">Contact Us</h2>
          <p className="text-brand-muted mb-8 max-w-md mx-auto">
            Questions about an order or product? Reach us anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://wa.me/8801700000000"
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              <MessageCircle size={18} /> WhatsApp
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              <FacebookIcon size={18} /> Facebook
            </a>
            <a href="https://m.me/urbancart" target="_blank" rel="noreferrer" className="btn-dark">
              <Phone size={18} /> Messenger
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
