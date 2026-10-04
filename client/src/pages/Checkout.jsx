import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/api';
import { formatBDT, getThumbnail } from '../utils/helpers';
import { getStoredReferral, normalizeReferralMobile } from '../utils/referral';
import ProtectedRoute from '../components/ProtectedRoute';

const CheckoutForm = () => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const storedRef = getStoredReferral() || user?.referredBy || '';
  const referralApplied = Boolean(storedRef);
  const [form, setForm] = useState({
    fullName: user?.address?.fullName || user?.name || '',
    mobile: user?.address?.mobile || user?.mobile || '',
    fullAddress: user?.address?.fullAddress || '',
    district: user?.address?.district || '',
    area: user?.address?.area || '',
    referenceNumber: storedRef || user?.address?.referenceNumber || '',
    orderNotes: '',
  });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cart.items?.length) {
      toast.error('Your cart is empty');
      return;
    }
    setLoading(true);
    try {
      const referenceNumber =
        normalizeReferralMobile(
          user?.referredBy || getStoredReferral() || form.referenceNumber || ''
        ) ||
        String(user?.referredBy || getStoredReferral() || form.referenceNumber || '').trim();
      const res = await createOrder({
        deliveryAddress: {
          fullName: form.fullName,
          mobile: form.mobile,
          fullAddress: form.fullAddress,
          district: form.district,
          area: form.area,
          referenceNumber,
        },
        orderNotes: form.orderNotes,
        paymentMethod: 'cash_on_delivery',
        referralCode: referenceNumber,
      });
      await fetchCart();
      toast.success('Order placed successfully!');
      navigate(`/dashboard/orders/${res.data.order._id}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart.items?.length) {
    return (
      <div className="pt-6 text-center py-20">
        <h1 className="font-display text-3xl mb-4">Nothing to checkout</h1>
        <Link to="/products" className="btn-primary">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout — Nogor Car</title>
      </Helmet>
      <div className="pt-6 pb-16">
        <div className="container-uc px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl mb-8">Checkout</h1>
          <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-brand-border rounded-2xl p-6 space-y-4">
                <h2 className="font-display text-2xl mb-2">Delivery Details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                    <input
                      name="fullName"
                      required
                      value={form.fullName}
                      onChange={onChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Mobile Number *</label>
                    <input
                      name="mobile"
                      required
                      value={form.mobile}
                      onChange={onChange}
                      className="input-field"
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Address *</label>
                  <textarea
                    name="fullAddress"
                    required
                    rows={3}
                    value={form.fullAddress}
                    onChange={onChange}
                    className="input-field resize-none"
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">District *</label>
                    <input
                      name="district"
                      required
                      value={form.district}
                      onChange={onChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Area *</label>
                    <input
                      name="area"
                      required
                      value={form.area}
                      onChange={onChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Reference / Referral number
                      {referralApplied ? (
                        <span className="ml-1.5 text-xs font-normal text-emerald-700">
                          Referral applied
                        </span>
                      ) : (
                        <span className="ml-1.5 text-xs font-normal text-brand-muted">
                          (optional)
                        </span>
                      )}
                    </label>
                    <input
                      name="referenceNumber"
                      value={form.referenceNumber}
                      onChange={onChange}
                      className={`input-field ${referralApplied ? 'bg-neutral-50' : ''}`}
                      placeholder="01XXXXXXXXX"
                      inputMode="tel"
                      readOnly={referralApplied}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Order Notes</label>
                  <textarea
                    name="orderNotes"
                    rows={2}
                    value={form.orderNotes}
                    onChange={onChange}
                    className="input-field resize-none"
                    placeholder="Any special instructions..."
                  />
                </div>
              </div>

              <div className="bg-white border border-brand-border rounded-2xl p-6">
                <h2 className="font-display text-2xl mb-4">Payment Method</h2>
                <label className="flex items-center gap-3 p-4 border-2 border-brand-gold rounded-xl bg-brand-gold/5 cursor-pointer">
                  <input type="radio" checked readOnly className="accent-brand-gold" />
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-brand-muted">Pay when you receive your order</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white border border-brand-border rounded-2xl p-6 h-fit sticky top-28">
              <h2 className="font-display text-2xl mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item._id} className="flex gap-3 text-sm">
                    <img
                      src={getThumbnail(item.product)}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 font-medium">{item.product.name}</p>
                      <p className="text-brand-muted">
                        {item.quantity} × {formatBDT(item.product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-brand-border pt-4">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Subtotal</span>
                  <span>{formatBDT(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Delivery</span>
                  <span>{formatBDT(cart.deliveryCharge)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2">
                  <span>Total</span>
                  <span className="text-brand-gold">{formatBDT(cart.total)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const Checkout = () => (
  <ProtectedRoute>
    <CheckoutForm />
  </ProtectedRoute>
);

export default Checkout;
