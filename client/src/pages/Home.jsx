import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingBag, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getCategories, getHeroImages, getProducts } from '../services/api';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import MembershipSection from '../components/membership/MembershipSection';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';

const HERO_INTERVAL_MS = 5000;
const PRODUCTS_PAGE_SIZE = 20;

const Home = () => {
  const { siteName } = useSiteSettings();
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPages, setProductsPages] = useState(1);
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const sentinelRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getCategories({ type: 'general' }),
      getHeroImages().catch(() => ({ data: { images: [] } })),
    ])
      .then(([catRes, heroRes]) => {
        const list = [...(catRes.data.categories || [])].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)
        );
        setCategories(list);
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

    getProducts({ type: 'general', limit: PRODUCTS_PAGE_SIZE, page: 1, sort: 'newest', scope: 'home' })
      .then((res) => {
        setProducts(res.data.products || []);
        setProductsPage(res.data.pagination?.page || 1);
        setProductsPages(res.data.pagination?.pages || 1);
      })
      .catch(() => {
        setProducts([]);
        setProductsPage(1);
        setProductsPages(1);
      })
      .finally(() => setProductsLoading(false));
  }, [siteName]);

  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || productsPage >= productsPages) return;
    setLoadingMore(true);
    try {
      const nextPage = productsPage + 1;
      const res = await getProducts({
        type: 'general',
        limit: PRODUCTS_PAGE_SIZE,
        page: nextPage,
        sort: 'newest',
        scope: 'home',
      });
      const next = res.data.products || [];
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        return [...prev, ...next.filter((p) => !seen.has(p._id))];
      });
      setProductsPage(res.data.pagination?.page || nextPage);
      setProductsPages(res.data.pagination?.pages || productsPages);
    } catch {
      /* keep current list */
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, productsPage, productsPages]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || productsLoading) return undefined;
    if (productsPage >= productsPages) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMoreProducts();
        }
      },
      { rootMargin: '240px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMoreProducts, productsLoading, productsPage, productsPages]);

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

  return (
    <>
      <Helmet>
        <title>{siteName} — Car Accessories</title>
      </Helmet>

      <div className="fixed top-3 right-3 sm:top-4 sm:right-5 z-50 flex items-center gap-1">
        <Link
          to="/products"
          className="hidden sm:inline-flex text-xs font-medium px-3 py-1.5 rounded-full bg-black/35 text-white backdrop-blur hover:bg-brand-gold hover:text-brand-black transition"
        >
          Shop
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

      <section className="relative h-[34svh] min-h-[180px] max-h-[240px] sm:h-[52svh] sm:min-h-[380px] sm:max-h-none overflow-hidden bg-brand-black">
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
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{ objectPosition: heroImages[heroIndex]?.position || 'center center' }}
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div
          className={`absolute inset-0 ${
            heroImages.length
              ? 'bg-brand-black/55'
              : 'bg-gradient-to-br from-neutral-900 via-brand-black to-neutral-950'
          }`}
        />

        <div className="absolute top-2 left-2 sm:top-3 sm:left-4 z-10 flex items-center gap-2.5 sm:gap-3.5 max-w-[calc(100%-6.5rem)] sm:max-w-[min(52%,28rem)]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex items-center gap-2.5 sm:gap-3.5 min-w-0"
          >
            {/* Larger logo on home hero (mobile + desktop) */}
            <img
              src="/logo.png?v=20261005"
              alt={siteName || 'Logo'}
              className="h-16 w-auto max-w-[15.5rem] sm:h-20 sm:max-w-[18rem] md:h-24 md:max-w-[22rem] object-contain object-left shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
            />
            <h1 className="sr-only">{siteName || 'Home'}</h1>
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

      <section className="bg-[#f7f6f4] pt-3 pb-6 sm:pt-4 sm:pb-8">
        <div className="container-uc px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          <MembershipSection />

          <div>
            <div className="mb-3 sm:mb-4">
              <p className="text-brand-gold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5">
                Collections
              </p>
              <h2 className="font-display text-lg sm:text-xl text-brand-black">Categories</h2>
              <p className="text-xs sm:text-sm text-brand-muted mt-1">
                Shop by accessory type
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 sm:h-14 rounded-xl bg-neutral-200/80 animate-pulse"
                  />
                ))
              ) : categories.length === 0 ? (
                <p className="col-span-2 text-sm text-brand-muted py-6 text-center rounded-xl border border-dashed border-brand-border">
                  No categories yet — add them from the admin panel.
                </p>
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/products?category=${cat._id}`}
                    className="flex items-center justify-center gap-2 min-h-12 sm:min-h-14 px-3 py-3 rounded-xl bg-white border border-brand-border text-center text-sm sm:text-[15px] font-medium text-brand-black/85 hover:border-brand-gold hover:text-brand-black hover:bg-white transition shadow-sm"
                  >
                    {cat.icon ? (
                      <img
                        src={cat.icon}
                        alt=""
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-md object-cover shrink-0"
                      />
                    ) : null}
                    <span className="line-clamp-2">{cat.name}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 sm:mb-4">
              <p className="text-brand-gold text-[10px] sm:text-xs uppercase tracking-widest mb-0.5">
                Shop
              </p>
              <h2 className="font-display text-lg sm:text-xl text-brand-black">Products</h2>
              <p className="text-xs sm:text-sm text-brand-muted mt-1">
                Featured car accessories
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {productsLoading
                ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : products.length === 0
                  ? (
                    <p className="col-span-2 md:col-span-3 lg:col-span-4 text-sm text-brand-muted py-8 text-center rounded-xl border border-dashed border-brand-border">
                      No products yet — add them from the admin panel.
                    </p>
                    )
                  : products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
            </div>
            <div ref={sentinelRef} className="h-8 flex items-center justify-center mt-4">
              {loadingMore ? (
                <Loader2 size={18} className="animate-spin text-brand-muted" aria-label="Loading more" />
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
