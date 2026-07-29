import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatBDT, getThumbnail } from '../utils/helpers';

const Cart = () => {
  const { cart, updateItem, removeItem, clear, loading } = useCart();

  if (loading) {
    return (
      <div className="pt-28 min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cart.items?.length) {
    return (
      <>
        <Helmet>
          <title>Cart — UrbanCart</title>
        </Helmet>
        <div className="pt-28 pb-16 text-center">
          <div className="container-uc px-4 py-20">
            <ShoppingBag size={48} className="mx-auto text-brand-muted mb-4" />
            <h1 className="font-display text-3xl mb-2">Your cart is empty</h1>
            <p className="text-brand-muted mb-8">Looks like you haven't added anything yet.</p>
            <Link to="/products" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Cart — UrbanCart</title>
      </Helmet>
      <div className="pt-28 pb-16">
        <div className="container-uc px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-4xl">Shopping Cart</h1>
            <button
              onClick={clear}
              className="text-sm text-red-600 hover:underline flex items-center gap-1"
            >
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item._id}
                  className="flex gap-4 bg-white border border-brand-border rounded-2xl p-4"
                >
                  <Link
                    to={`/products/${item.product._id}`}
                    className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-neutral-100"
                  >
                    <img
                      src={getThumbnail(item.product)}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product._id}`}
                      className="font-medium hover:text-brand-gold line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-brand-gold font-semibold mt-1">
                      {formatBDT(item.product.price)}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-brand-border rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            updateItem(item.product._id, Math.max(1, item.quantity - 1))
                          }
                          className="p-2 hover:bg-neutral-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.product._id, item.quantity + 1)}
                          className="p-2 hover:bg-neutral-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{formatBDT(item.lineTotal)}</span>
                        <button
                          onClick={() => removeItem(item.product._id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-brand-border rounded-2xl p-6 h-fit sticky top-28">
              <h2 className="font-display text-2xl mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Subtotal</span>
                  <span className="font-medium">{formatBDT(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Delivery Charge</span>
                  <span className="font-medium">{formatBDT(cart.deliveryCharge)}</span>
                </div>
                <div className="border-t border-brand-border pt-3 flex justify-between text-base">
                  <span className="font-semibold">Grand Total</span>
                  <span className="font-semibold text-brand-gold text-lg">
                    {formatBDT(cart.total)}
                  </span>
                </div>
              </div>
              <Link to="/checkout" className="btn-primary w-full mt-6 text-center">
                Proceed to Checkout
              </Link>
              <Link
                to="/products"
                className="block text-center text-sm text-brand-muted mt-4 hover:text-brand-gold"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
