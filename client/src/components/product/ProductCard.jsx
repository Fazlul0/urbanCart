import { Link } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import StarRating from '../ui/StarRating';
import { formatBDT, getThumbnail, AVAILABILITY_LABELS } from '../../utils/helpers';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const thumb = getThumbnail(product);
  const inStock = product.availability === 'in_stock';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500 border border-brand-border/60"
    >
      <Link
        to={`/products/${product._id}`}
        className="block relative aspect-square overflow-hidden bg-neutral-100"
      >
        <img
          src={thumb}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
        />
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
              inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

      <div className="p-2 sm:p-4 space-y-1 sm:space-y-2">
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
        <div className="hidden sm:block">
          <StarRating rating={product.rating} size={14} showValue />
        </div>
        <p className="text-sm sm:text-lg font-semibold text-brand-black">
          {formatBDT(product.price)}
          {product.productType === 'food' && product.unitType && product.unitType !== 'piece' && (
            <span className="text-xs font-normal text-brand-muted"> / {product.unitType}</span>
          )}
        </p>
        {product.minOrder != null && Number(product.minOrder) !== 1 && (
          <p className="text-[10px] sm:text-xs text-brand-muted">
            Min {product.minOrder} {product.unitType || 'pcs'}
          </p>
        )}
        <button
          onClick={() => addItem(product._id, product.minOrder || 1)}
          disabled={!inStock}
          className="w-full btn-primary text-[11px] sm:text-sm mt-1 sm:mt-2 py-1.5 sm:py-2.5 px-2 gap-1"
        >
          <ShoppingBag size={14} />
          <span className="truncate sm:hidden">{inStock ? 'Add' : 'Out'}</span>
          <span className="hidden sm:inline">{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
        </button>
      </div>
    </motion.article>
  );
};

export default ProductCard;
