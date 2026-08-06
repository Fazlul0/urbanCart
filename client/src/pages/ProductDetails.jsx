import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import StarRating from '../components/ui/StarRating';
import ProductCard from '../components/product/ProductCard';
import { formatBDT, getThumbnail, AVAILABILITY_LABELS } from '../utils/helpers';
import { getProduct, getRelatedProducts, getProductReviews, createReview } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetails = () => {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState({ x: 50, y: 50, active: false });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getProduct(id),
      getRelatedProducts(id),
      getProductReviews(id),
    ])
      .then(([p, r, rev]) => {
        setProduct(p.data.product);
        setRelated(r.data.products);
        setReviews(rev.data.reviews);
        setActiveImage(0);
        setQty(p.data.product?.minOrder || 1);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to leave a review');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createReview({
        productId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      setReviews([res.data.review, ...reviews]);
      setReviewForm({ rating: 5, comment: '' });
      toast.success('Review submitted');
      const p = await getProduct(id);
      setProduct(p.data.product);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
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
    : [{ url: getThumbnail(product) }];
  const specs = product.specifications
    ? product.specifications instanceof Map
      ? Object.fromEntries(product.specifications)
      : product.specifications
    : {};

  return (
    <>
      <Helmet>
        <title>{product.name} — UrbanCart</title>
        <meta name="description" content={product.description?.slice(0, 160)} />
      </Helmet>

      <div className="pt-6 pb-16">
        <div className="container-uc px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Gallery */}
            <div>
              <div
                className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 cursor-zoom-in"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setZoom({
                    x: ((e.clientX - rect.left) / rect.width) * 100,
                    y: ((e.clientY - rect.top) / rect.height) * 100,
                    active: true,
                  });
                }}
                onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
                onClick={() => setLightbox(true)}
              >
                <img
                  src={images[activeImage]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-200"
                  style={
                    zoom.active
                      ? { transform: 'scale(1.6)', transformOrigin: `${zoom.x}% ${zoom.y}%` }
                      : undefined
                  }
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 ${
                        i === activeImage ? 'border-brand-gold' : 'border-transparent'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {product.category && (
                <Link
                  to={`/products?category=${product.category._id}`}
                  className="text-brand-gold text-sm uppercase tracking-wider font-medium"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="font-display text-3xl md:text-4xl mt-2 mb-4">{product.name}</h1>
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={product.rating} showValue />
                <span className="text-sm text-brand-muted">
                  {product.totalReviews} review{product.totalReviews !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-3xl font-semibold mb-4">
                {formatBDT(product.price)}
                {product.unitType && product.unitType !== 'piece' && (
                  <span className="text-base font-normal text-brand-muted"> / {product.unitType}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span
                  className={`inline-block text-sm font-medium px-3 py-1 rounded-full ${
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
                  <span className="inline-block text-sm font-medium px-3 py-1 rounded-full bg-emerald-600 text-white">
                    Free Delivery
                  </span>
                )}
                {product.minOrder != null && (
                  <span className="inline-block text-sm font-medium px-3 py-1 rounded-full bg-neutral-100 text-brand-muted">
                    Min order: {product.minOrder} {product.unitType || 'pcs'}
                  </span>
                )}
              </div>
              <p className="text-brand-muted leading-relaxed mb-8">{product.description}</p>

              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 rounded-full bg-neutral-100 text-brand-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex items-center border border-brand-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => {
                      const step = product.unitType === 'kg' ? 0.25 : product.unitType === 'g' ? 50 : 1;
                      const min = product.minOrder || 1;
                      setQty(Math.max(min, Math.round((qty - step) * 100) / 100));
                    }}
                    className="p-3 hover:bg-neutral-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 font-medium min-w-[3.5rem] text-center">
                    {qty}
                    {product.unitType && product.unitType !== 'piece' ? ` ${product.unitType}` : ''}
                  </span>
                  <button
                    onClick={() => {
                      const step = product.unitType === 'kg' ? 0.25 : product.unitType === 'g' ? 50 : 1;
                      setQty(Math.round((qty + step) * 100) / 100);
                    }}
                    className="p-3 hover:bg-neutral-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={() => addItem(product._id, qty)}
                  disabled={product.availability === 'out_of_stock'}
                  className="btn-primary flex-1 min-w-[180px]"
                >
                  <ShoppingBag size={18} /> Add to Cart
                </button>
              </div>

              {Object.keys(specs).length > 0 && (
                <div className="border border-brand-border rounded-2xl overflow-hidden">
                  <h3 className="font-medium px-5 py-3 bg-neutral-50 border-b border-brand-border">
                    Specifications
                  </h3>
                  <dl>
                    {Object.entries(specs).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex px-5 py-3 border-b border-brand-border last:border-0 text-sm"
                      >
                        <dt className="w-1/3 text-brand-muted">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <section className="mt-20">
            <h2 className="font-display text-3xl mb-8">Customer Reviews</h2>
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-brand-muted py-8">No reviews yet. Be the first!</p>
                ) : (
                  reviews.map((r) => (
                    <div
                      key={r._id}
                      className="bg-white border border-brand-border rounded-2xl p-5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{r.user?.name || 'Customer'}</p>
                        <span className="text-xs text-brand-muted">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <StarRating rating={r.rating} size={14} />
                      <p className="text-brand-muted text-sm mt-3 leading-relaxed">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
              <div>
                <form
                  onSubmit={handleReview}
                  className="bg-white border border-brand-border rounded-2xl p-6 space-y-4 sticky top-28"
                >
                  <h3 className="font-medium">Write a Review</h3>
                  <p className="text-xs text-brand-muted">
                    Only customers who purchased this product can review.
                  </p>
                  <div>
                    <label className="text-sm mb-2 block">Rating</label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, rating: Number(e.target.value) })
                      }
                      className="input-field py-2.5"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} Star{n > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm mb-2 block">Comment</label>
                    <textarea
                      required
                      rows={4}
                      value={reviewForm.comment}
                      onChange={(e) =>
                        setReviewForm({ ...reviewForm, comment: e.target.value })
                      }
                      className="input-field resize-none"
                      placeholder="Share your experience..."
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="font-display text-3xl mb-8">Related Products</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-6 right-6 text-white" onClick={() => setLightbox(false)}>
            <X size={28} />
          </button>
          <img
            src={images[activeImage]?.url}
            alt={product.name}
            className="max-h-[90vh] max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ProductDetails;
