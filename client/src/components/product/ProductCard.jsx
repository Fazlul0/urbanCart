import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Eye, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import StarRating from '../ui/StarRating';
import { formatBDT, getThumbnailMedia, AVAILABILITY_LABELS } from '../../utils/helpers';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import ShareButton from '../ui/ShareButton';
import { saveReturnPath } from '../../utils/authReturn';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const thumb = getThumbnailMedia(product);
  const canBuy =
    product.availability === 'in_stock' || product.availability === 'preorder';
  const qty = product.minOrder || 1;

  const requireLogin = () => {
    const next = location.pathname + location.search;
    saveReturnPath(next);
    navigate('/login', { state: { from: next, authPrompt: true } });
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canBuy) return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    await addItem(product._id, qty);
  };

  const handlePurchaseNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canBuy) return;
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    const ok = await addItem(product._id, qty);
    if (ok) navigate('/checkout');
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative bg-white rounded-xl sm:rounded-2xl overflow-visible shadow-sm hover:shadow-xl transition-shadow duration-500 border border-brand-border/60"
    >
      <Link
        to={`/products/${product._id}`}
        className="block relative aspect-square overflow-hidden bg-neutral-100"
      >
        {thumb.type === 'video' ? (
          <video
            src={thumb.url}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <img
            src={thumb.url}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          />
        )}
        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2">
          {product.featured && (
            <span className="bg-brand-gold text-brand-black text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              Featured
            </span>
          )}
          {product.freeDelivery && (
            <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
              Free Delivery
            </span>
          )}
          <span
            className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
              product.availability === 'in_stock'
                ? 'bg-green-100 text-green-800'
                : product.availability === 'preorder'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {AVAILABILITY_LABELS[product.availability] || product.availability}
          </span>
        </div>
        <div className="absolute inset-0 bg-brand-black/0 group-hover:bg-brand-black/20 transition-colors duration-300 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white text-brand-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
            <Eye size={16} /> View Details
          </span>
        </div>
      </Link>

      <div className="p-2 sm:p-3 space-y-0.5 sm:space-y-1.5">
        {product.category && (
          <p className="hidden sm:block text-xs uppercase tracking-wider text-brand-gold font-medium">
            {product.category.name}
          </p>
        )}
        <Link to={`/products/${product._id}`}>
          <h3 className="font-medium text-brand-black line-clamp-2 hover:text-brand-gold transition-colors text-xs sm:text-base min-h-[2rem] sm:min-h-[2.75rem]">
            {product.name}
          </h3>
        </Link>
        {product.productCode ? (
          <p className="text-[10px] sm:text-xs font-mono text-brand-muted tracking-wide">
            {product.productCode}
          </p>
        ) : null}
        <div className="hidden sm:block">
          <StarRating rating={product.rating} size={14} showValue />
        </div>
        <p className="text-sm sm:text-lg font-semibold text-brand-black flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {product.compareAtPrice != null &&
            Number(product.compareAtPrice) > Number(product.price) && (
              <span className="text-xs sm:text-sm font-normal text-brand-muted line-through">
                {formatBDT(product.compareAtPrice)}
              </span>
            )}
          <span>
            {formatBDT(product.price)}
            {product.productType === 'food' && product.unitType && product.unitType !== 'piece' && (
              <span className="text-xs font-normal text-brand-muted"> / {product.unitType}</span>
            )}
          </span>
        </p>
        {product.minOrder != null && Number(product.minOrder) > 1 && (
          <p className="text-[10px] sm:text-xs text-brand-muted">
            Min {product.minOrder}{' '}
            {product.unitType && product.unitType !== 'piece' ? product.unitType : 'pcs'}
          </p>
        )}
        <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canBuy}
            aria-label={canBuy ? 'Add to cart' : 'Out of stock'}
            title={canBuy ? 'Add to cart' : 'Out of stock'}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-0.5 bg-brand-gold text-brand-black font-semibold text-[9px] sm:text-[11px] leading-none py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-md hover:bg-brand-gold-light transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag size={13} className="shrink-0" />
            <span className="truncate">{canBuy ? 'Add' : 'Out'}</span>
          </button>
          <button
            type="button"
            onClick={handlePurchaseNow}
            disabled={!canBuy}
            aria-label={canBuy ? 'Buy now' : 'Out of stock'}
            title={canBuy ? 'Buy now' : 'Out of stock'}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-0.5 border border-brand-gold text-brand-black font-semibold text-[9px] sm:text-[11px] leading-none py-1 sm:py-1.5 px-0.5 sm:px-1.5 rounded-md hover:bg-brand-gold/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={13} className="shrink-0" />
            <span className="truncate">{canBuy ? 'Buy' : 'Out'}</span>
          </button>
          <div
            className="shrink-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ShareButton
              path={`/products/${product._id}`}
              title={product.name}
              iconOnly
              size={13}
              className="h-full [&>button]:h-full [&>button]:min-h-[26px] sm:[&>button]:min-h-[30px] [&>button]:px-1.5 [&>button]:py-1 [&>button]:rounded-md"
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
