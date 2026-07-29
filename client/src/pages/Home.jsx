import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Truck, Banknote, BadgeCheck, Star, MessageCircle, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { getProducts, getCategories } from '../services/api';
import FacebookIcon from '../components/ui/FacebookIcon';

const HERO_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1920&q=85',
    alt: 'Premium chronograph watch',
    position: 'center 30%',
  },
  {
    src: 'https://images.unsplash.com/photo-1627123424574-724758594f93?w=1920&q=85',
    alt: 'Leather wallet',
    position: 'center center',
  },
  {
    src: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1920&q=85',
    alt: 'Aviator sunglasses',
    position: 'center 40%',
  },
  {
    src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=85',
    alt: 'Car accessories',
    position: 'center 45%',
  },
  {
    src: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=1920&q=85',
    alt: 'Minimalist watch',
    position: 'center 35%',
  },
];

const HERO_INTERVAL_MS = 5000;

const reviews = [
  {
    name: 'Rahim Ahmed',
    text: 'The Aurora Chronograph exceeded my expectations. Premium feel and fast COD delivery.',
    rating: 5,
  },
  {
    name: 'Karim Hassan',
    text: 'Best wallet I have bought online in BD. Quality leather and RFID protection works great.',
    rating: 5,
  },
  {
    name: 'Nayeem Islam',
    text: 'Car looking glass looks amazing. Installation was easy and packaging was solid.',
    rating: 4,
  },
];

const whyUs = [
  { icon: Shield, title: 'Premium Quality', desc: 'Curated accessories built to last' },
  { icon: Truck, title: 'Fast Delivery', desc: 'Quick shipping across Bangladesh' },
  { icon: Banknote, title: 'Cash On Delivery', desc: 'Pay when you receive your order' },
  { icon: BadgeCheck, title: 'Trusted Products', desc: 'Genuine items, honest reviews' },
];

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      getProducts({ featured: true, limit: 8 }),
      getCategories(),
    ])
      .then(([prodRes, catRes]) => {
        setFeatured(prodRes.data.products);
        setCategories(catRes.data.categories.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    HERO_IMAGES.forEach((img) => {
      const preload = new Image();
      preload.src = img.src;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Helmet>
        <title>UrbanCart — Premium Men's Accessories</title>
      </Helmet>

      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-end sm:items-center overflow-hidden bg-brand-black">
        <AnimatePresence mode="sync">
          <motion.div
            key={heroIndex}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={HERO_IMAGES[heroIndex].src}
              alt={HERO_IMAGES[heroIndex].alt}
              className="w-full h-full object-cover"
              style={{ objectPosition: HERO_IMAGES[heroIndex].position }}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/70 to-brand-black/25 sm:bg-gradient-to-r sm:from-brand-black sm:via-brand-black/75 sm:to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,162,39,0.18),transparent_45%)]" />

        <div className="relative container-uc w-full px-4 sm:px-6 lg:px-8 pt-32 pb-16 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <h1 className="font-display text-[clamp(3.25rem,10vw,6.5rem)] leading-[0.9] text-white tracking-tight mb-5">
              Urban<span className="text-brand-gold">Cart</span>
            </h1>
            <p className="font-display text-2xl sm:text-3xl text-white/90 leading-snug mb-4">
              Accessories for the modern gentleman
            </p>
            <p className="text-neutral-300 text-base sm:text-lg mb-9 max-w-md leading-relaxed">
              Watches, wallets, and car essentials — curated quality, Cash on Delivery across Bangladesh.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-brand-gold text-brand-black font-medium px-7 py-3.5 rounded-full hover:bg-brand-gold-light transition-all duration-300 hover:-translate-y-0.5"
              >
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 border border-white/35 text-white px-7 py-3.5 rounded-full hover:border-brand-gold hover:text-brand-gold transition-all duration-300"
              >
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 right-6 sm:right-10 z-10 flex items-center gap-2">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setHeroIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === heroIndex
                  ? 'w-8 bg-brand-gold'
                  : 'w-1.5 bg-white/35 hover:bg-white/60'
              }`}
            />
          ))}
        </div>

        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2 text-white/40"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[10px] tracking-[0.25em] uppercase">Scroll</span>
          <span className="w-px h-8 bg-gradient-to-b from-brand-gold/80 to-transparent" />
        </motion.div>
      </section>

      {/* Categories */}
      <section className="section-pad">
        <div className="container-uc">
          <div className="text-center mb-12">
            <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Collections</p>
            <h2 className="font-display text-4xl md:text-5xl text-brand-black">Featured Categories</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/products?category=${cat._id}`}
                  className="group relative block aspect-[4/5] rounded-2xl overflow-hidden"
                >
                  <img
                    src={cat.image || 'https://placehold.co/400x500/111/C9A227?text=UC'}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-brand-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-2xl text-white group-hover:text-brand-gold transition">
                      {cat.name}
                    </h3>
                    <p className="text-neutral-300 text-sm mt-1 line-clamp-2">{cat.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-pad bg-white">
        <div className="container-uc">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Handpicked</p>
              <h2 className="font-display text-4xl md:text-5xl text-brand-black">Featured Products</h2>
            </div>
            <Link to="/products" className="btn-outline text-sm py-2.5">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-pad">
        <div className="container-uc">
          <div className="text-center mb-12">
            <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Why UrbanCart</p>
            <h2 className="font-display text-4xl md:text-5xl text-brand-black">Why Choose Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyUs.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-brand-gold/15 flex items-center justify-center text-brand-gold">
                  <item.icon size={28} />
                </div>
                <h3 className="font-display text-xl mb-2">{item.title}</h3>
                <p className="text-brand-muted text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="section-pad bg-brand-black text-white">
        <div className="container-uc">
          <div className="text-center mb-12">
            <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Testimonials</p>
            <h2 className="font-display text-4xl md:text-5xl">Customer Reviews</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} size={16} className="fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                <p className="text-neutral-300 leading-relaxed mb-6">"{r.text}"</p>
                <p className="font-medium text-brand-gold">{r.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About snippet */}
      <section className="section-pad">
        <div className="container-uc grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80"
              alt="About UrbanCart"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">About Us</p>
            <h2 className="font-display text-4xl md:text-5xl mb-6">Crafted for Modern Men</h2>
            <p className="text-brand-muted leading-relaxed mb-6">
              UrbanCart is your destination for premium men's accessories in Bangladesh. From
              precision watches to refined wallets and stylish car upgrades — we curate products
              that blend quality, design, and everyday utility.
            </p>
            <Link to="/about" className="btn-dark">
              Learn More <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="section-pad bg-white">
        <div className="container-uc text-center">
          <p className="text-brand-gold text-sm uppercase tracking-widest mb-2">Get In Touch</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">Contact Us</h2>
          <p className="text-brand-muted mb-10 max-w-md mx-auto">
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
