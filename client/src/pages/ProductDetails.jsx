import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Minus, Plus, ShoppingBag, X, Zap } from 'lucide-react';
import StarRating from '../components/ui/StarRating';
import ProductCard from '../components/product/ProductCard';
import { formatBDT, getThumbnail, isVideoMedia, AVAILABILITY_LABELS } from '../utils/helpers';
import { getProduct, getRelatedProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ShareButton from '../components/ui/ShareButton';
import { saveReturnPath } from '../utils/authReturn';

const ProductDetails = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([getProduct(id), getRelatedProducts(id)])
      .then(([p, r]) => {
        setProduct(p.data.product);
        setRelated(r.data.products);
        setActiveImage(0);
        setQty(p.data.product?.minOrder || 1);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const requireLogin = () => {
    const next = location.pathname + location.search;
    saveReturnPath(next);
    navigate('/login', { state: { from: next, authPrompt: true } });
  };

  const handleAddToCart = async () => {
    if (!product || product.availability === 'out_of_stock') return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    await addItem(product._id, qty);
  };

  const handlePurchaseNow = async () => {
    if (!product || product.availability === 'out_of_stock') return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    setBuying(true);
    try {
      const ok = await addItem(product._id, qty);
      if (ok) navigate('/checkout');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-6 min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-6 text-center py-20">
        <h1 className="font-display text-3xl mb-4">Product not found</h1>
        <Link to="/products" className="btn-primary">
          Back to Shop
        </Link>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ url: getThumbnail(product), type: 'image' }];
  const active = images[activeImage] || images[0];
  const activeIsVideo = isVideoMedia(active);
  const specs = product.specifications
    ? product.specifications instanceof Map
      ? Object.fromEntries(product.specifications)
      : product.specifications
    : {};

  const qtyStep = product.unitType === 'kg' ? 0.25 : product.unitType === 'g' ? 50 : 1;
  const qtyMin = product.minOrder || 1;
  const outOfStock = product.availability === 'out_of_stock';

  const qtyControl = (
    <div className="flex items-center justify-center border border-brand-border rounded-xl overflow-hidden bg-white shrink-0">
      <button
        type="button"
        onClick={() => setQty(Math.max(qtyMin, Math.round((qty - qtyStep) * 100) / 100))}
        className="p-2.5 sm:p-3 hover:bg-neutral-50"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="px-3 sm:px-4 font-medium min-w-[2.75rem] text-center text-sm sm:text-base">
        {qty}
        {product.unitType && product.unitType !== 'piece' ? ` ${product.unitType}` : ''}
      </span>
      <button
        type="button"
        onClick={() => setQty(Math.round((qty + qtyStep) * 100) / 100)}
        className="p-2.5 sm:p-3 hover:bg-neutral-50"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>{product.name} — Nogor Car</title>
        <meta name="description" content={product.description?.slice(0, 160)} />
      </Helmet>

      {/* Extra bottom pad on mobile for sticky buy bar + footer */}
      <div className="pt-3 sm:pt-6 pb-28 sm:pb-16 overflow-x-clip">
        <div className="container-uc px-3 sm:px-6 lg:px-8 max-w-full">
          <div className="grid lg:grid-cols-2 gap-5 sm:gap-10 lg:gap-16">
            {/* Gallery — full image fits phone width, no crop */}
            <div className="min-w-0">
              <button
                type="button"
                className={`relative block w-full max-w-full rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-brand-border/60 text-left ${
                  activeIsVideo ? '' : 'cursor-zoom-in'
                }`}
                onMouseMove={
                  activeIsVideo
                    ? undefined
                    : (e) => {
                        if (
                          typeof window !== 'undefined' &&
                          window.matchMedia('(max-width: 639px)').matches
                        ) {
                          return;
                        }
                        const rect = e.currentTarget.getBoundingClientRect();
                        setZoom({
                          x: ((e.clientX - rect.left) / rect.width) * 100,
                          y: ((e.clientY - rect.top) / rect.height) * 100,
                          active: true,
                        });
                      }
                }
                onMouseLeave={
                  activeIsVideo ? undefined : () => setZoom((z) => ({ ...z, active: false }))
                }
                onClick={() => {
                  if (activeIsVideo) return;
                  setLightbox(true);
                }}
              >
                {activeIsVideo ? (
                  <video
                    key={active?.url}
                    src={active?.url}
                    controls
                    playsInline
                    className="w-full max-w-full h-auto max-h-[42vh] sm:max-h-[70vh] object-contain mx-auto block"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <img
                    src={active?.url}
                    alt={product.name}
                    className="w-full max-w-full h-auto max-h-[42vh] sm:max-h-[70vh] object-contain object-center mx-auto block transition-transform duration-200"
                    style={
                      zoom.active
                        ? { transform: 'scale(1.6)', transformOrigin: `${zoom.x}% ${zoom.y}%` }
                        : undefined
                    }
                  />
                )}
              </button>
              {images.length > 1 && (
                <div className="flex gap-1.5 sm:gap-3 mt-2.5 sm:mt-4 overflow-x-auto overscroll-x-contain pb-1 touch-pan-x">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`w-11 h-11 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border-2 bg-white ${
                        i === activeImage ? 'border-brand-gold' : 'border-transparent'
                      }`}
                    >
                      {isVideoMedia(img) ? (
                        <video
                          src={img.url}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-contain bg-white"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0">
              {product.category && (
                <Link
                  to={`/products?category=${product.category._id}`}
                  className="text-brand-gold text-xs sm:text-sm uppercase tracking-wider font-medium break-words"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="font-display text-lg sm:text-3xl md:text-4xl mt-1.5 sm:mt-2 mb-1.5 sm:mb-2 leading-snug break-words">
                {product.name}
              </h1>
              {product.productCode ? (
                <p className="text-xs sm:text-sm font-mono text-brand-muted mb-2 sm:mb-4">
                  Code: {product.productCode}
                </p>
              ) : (
                <div className="mb-2 sm:mb-4" />
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <StarRating rating={product.rating} showValue />
                <span className="text-xs sm:text-sm text-brand-muted">
                  {product.totalReviews} review{product.totalReviews !== 1 ? 's' : ''}
                </span>
                <ShareButton
                  path={`/products/${product._id}`}
                  title={product.name}
                  iconOnly
                  size={16}
                  className="inline-flex ml-auto sm:ml-0"
                />
              </div>
              <p className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {product.compareAtPrice != null &&
                  Number(product.compareAtPrice) > Number(product.price) && (
                    <span className="text-base sm:text-xl font-normal text-brand-muted line-through">
                      {formatBDT(product.compareAtPrice)}
                    </span>
                  )}
                <span>
                  {formatBDT(product.price)}
                  {product.unitType && product.unitType !== 'piece' && (
                    <span className="text-sm sm:text-base font-normal text-brand-muted">
                      {' '}
                      / {product.unitType}
                    </span>
                  )}
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-6">
                <span
                  className={`inline-block text-xs sm:text-sm font-medium px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full ${
                    product.availability === 'in_stock'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {AVAILABILITY_LABELS[product.availability]}
                  {product.stockQuantity > 0 && product.availability === 'in_stock'
                    ? ` · ${product.stockQuantity} left`
                    : ''}
                </span>
                {product.freeDelivery && (
                  <span className="inline-block text-xs sm:text-sm font-medium px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-600 text-white">
                    Free Delivery
                  </span>
                )}
                {product.minOrder != null && Number(product.minOrder) > 0 && (
                  <span className="inline-block text-xs sm:text-sm font-medium px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-neutral-100 text-brand-muted">
                    Min order: {product.minOrder}{' '}
                    {product.unitType && product.unitType !== 'piece' ? product.unitType : 'pcs'}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-brand-muted leading-relaxed mb-4 sm:mb-8 break-words">
                {product.description}
              </p>

              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-8">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-neutral-100 text-brand-muted break-all"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Desktop actions */}
              <div className="hidden sm:flex flex-row flex-wrap items-center gap-4 mb-8">
                {qtyControl}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                  className="btn-primary flex-1 min-w-[160px]"
                >
                  <ShoppingBag size={18} /> Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handlePurchaseNow}
                  disabled={outOfStock || buying}
                  className="btn-outline flex-1 min-w-[160px] border-brand-gold text-brand-black hover:bg-brand-gold/15"
                >
                  <Zap size={18} /> {buying ? 'Please wait...' : 'Purchase now'}
                </button>
              </div>

              {Object.keys(specs).length > 0 && (
                <div className="border border-brand-border rounded-xl sm:rounded-2xl overflow-hidden">
                  <h3 className="font-medium px-4 sm:px-5 py-2.5 sm:py-3 bg-neutral-50 border-b border-brand-border text-sm sm:text-base">
                    Specifications
                  </h3>
                  <dl>
                    {Object.entries(specs).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex gap-2 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-brand-border last:border-0 text-xs sm:text-sm"
                      >
                        <dt className="w-1/3 shrink-0 text-brand-muted break-words">{key}</dt>
                        <dd className="font-medium min-w-0 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <section className="mt-10 sm:mt-20">
              <h2 className="font-display text-xl sm:text-3xl mb-4 sm:mb-8">Related Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
                {related.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sticky buy bar — mobile only, above footer */}
      <div className="sm:hidden fixed inset-x-0 bottom-[5.75rem] z-[45] bg-white/95 backdrop-blur border-t border-brand-border px-3 py-2.5">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {qtyControl}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="btn-primary flex-1 min-w-0 text-xs px-2 py-2.5 gap-1"
          >
            <ShoppingBag size={15} className="shrink-0" />
            <span className="truncate">Cart</span>
          </button>
          <button
            type="button"
            onClick={handlePurchaseNow}
            disabled={outOfStock || buying}
            className="btn-outline flex-1 min-w-0 text-xs px-2 py-2.5 gap-1 border-brand-gold text-brand-black"
          >
            <Zap size={15} className="shrink-0" />
            <span className="truncate">{buying ? '...' : 'Buy'}</span>
          </button>
        </div>
      </div>

      {lightbox && !activeIsVideo && (
        <div
          className="fixed inset-0 z-[80] bg-black/95 flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white p-2"
            aria-label="Close"
            onClick={() => setLightbox(false)}
          >
            <X size={28} />
          </button>
          <img
            src={active?.url}
            alt={product.name}
            className="max-h-[92vh] max-w-[96vw] w-auto h-auto object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ProductDetails;
