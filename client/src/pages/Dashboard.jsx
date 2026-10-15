import { useEffect, useState } from 'react';
import { Link, Routes, Route, NavLink, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { User, Package, LogOut, ChevronRight, Users } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, getMyOrder, updateProfile, getMyReferrals } from '../services/api';
import { formatBDT, ORDER_STATUS_COLORS } from '../utils/helpers';
import DeliveryTracker from '../components/order/DeliveryTracker';

const ProfileTab = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    fullAddress: user?.address?.fullAddress || '',
    district: user?.address?.district || '',
    area: user?.address?.area || '',
    postalCode: user?.address?.postalCode || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfile({
        name: form.name,
        mobile: form.mobile,
        address: {
          fullName: form.name,
          mobile: form.mobile,
          fullAddress: form.fullAddress,
          district: form.district,
          area: form.area,
          postalCode: form.postalCode,
        },
      });
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-2xl p-4 sm:p-6 space-y-4 max-w-xl w-full min-w-0">
      <h2 className="font-display text-xl sm:text-2xl mb-2">My Profile</h2>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Email</label>
        <input value={user?.email || ''} disabled className="input-field bg-neutral-50" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Mobile</label>
        <input
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          className="input-field"
          required
        />
      </div>
      {(user?.mobile || form.mobile) && (
        <div className="rounded-xl border border-brand-gold/40 bg-brand-gold/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-muted mb-1">
            Your referral number
          </p>
          <p className="font-mono text-lg font-semibold text-brand-black">
            {user?.mobile || form.mobile}
          </p>
          <p className="text-xs text-brand-muted mt-1">
            Share products or membership — friends use this number as referral.
          </p>
        </div>
      )}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Address</label>
        <textarea
          value={form.fullAddress}
          onChange={(e) => setForm({ ...form, fullAddress: e.target.value })}
          className="input-field resize-none"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          placeholder="District"
          value={form.district}
          onChange={(e) => setForm({ ...form, district: e.target.value })}
          className="input-field"
        />
        <input
          placeholder="Area"
          value={form.area}
          onChange={(e) => setForm({ ...form, area: e.target.value })}
          className="input-field"
        />
        <input
          placeholder="Postal"
          value={form.postalCode}
          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
          className="input-field"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((res) => setOrders(res.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="bg-white border border-brand-border rounded-2xl p-10 text-center">
        <Package size={40} className="mx-auto text-brand-muted mb-3" />
        <p className="text-brand-muted mb-4">No orders yet</p>
        <Link to="/products" className="btn-primary">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl mb-4">My Orders</h2>
      {orders.map((order) => (
        <Link
          key={order._id}
          to={`/dashboard/orders/${order._id}`}
          className="flex items-center justify-between gap-3 bg-white border border-brand-border rounded-2xl p-4 sm:p-5 hover:shadow-md transition min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{order.orderNumber}</p>
            <p className="text-sm text-brand-muted mt-1 break-words">
              {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s)
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                ORDER_STATUS_COLORS[order.status]
              }`}
            >
              {order.status}
            </span>
            <span className="font-semibold hidden sm:block">{formatBDT(order.total)}</span>
            <ChevronRight size={18} className="text-brand-muted" />
          </div>
        </Link>
      ))}
    </div>
  );
};

const OrderDetailTab = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrder(orderId)
      .then((res) => setOrder(res.data.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-brand-muted">Order not found</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard/orders" className="text-sm text-brand-gold hover:underline">
        ← Back to Orders
      </Link>
      <div className="bg-white border border-brand-border rounded-2xl p-4 sm:p-6 min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h2 className="font-display text-xl sm:text-2xl break-all">{order.orderNumber}</h2>
            <p className="text-sm text-brand-muted mt-1 break-words">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full capitalize shrink-0 ${
              ORDER_STATUS_COLORS[order.status]
            }`}
          >
            {order.status}
          </span>
        </div>

        <div className="mb-6 px-1 sm:px-2 border border-brand-border rounded-xl bg-brand-cream/60 overflow-hidden">
          <DeliveryTracker status={order.status} />
        </div>

        <div className="space-y-3 mb-6">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center min-w-0">
              {item.image && (
                <img src={item.image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm break-words">{item.name}</p>
                <p className="text-xs text-brand-muted">
                  {item.quantity} × {formatBDT(item.price)}
                </p>
              </div>
              <p className="font-medium text-sm shrink-0">{formatBDT(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-border pt-4 grid sm:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium mb-2">Delivery Address</h3>
            <p>{order.deliveryAddress.fullName}</p>
            <p className="text-brand-muted">{order.deliveryAddress.mobile}</p>
            <p className="text-brand-muted">
              {order.deliveryAddress.fullAddress}, {order.deliveryAddress.area},{' '}
              {order.deliveryAddress.district}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-brand-muted">Subtotal</span>
              <span>{formatBDT(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Delivery</span>
              <span>{formatBDT(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2">
              <span>Total</span>
              <span className="text-brand-gold">{formatBDT(order.total)}</span>
            </div>
            <p className="text-brand-muted pt-2">Payment: Cash on Delivery</p>
          </div>
        </div>

        {order.statusHistory?.length > 0 && (
          <div className="mt-6 border-t border-brand-border pt-4">
            <h3 className="font-medium mb-3">Status History</h3>
            <ul className="space-y-2">
              {order.statusHistory.map((h, i) => (
                <li key={i} className="text-sm flex flex-col sm:flex-row gap-1 sm:gap-3 min-w-0">
                  <span className="text-brand-gold capitalize font-medium sm:w-24 shrink-0">
                    {h.status}
                  </span>
                  <span className="text-brand-muted break-words min-w-0">
                    {h.note} · {new Date(h.updatedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ReferralsTab = () => {
  const [data, setData] = useState({ total: 0, referrals: [], referralCode: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyReferrals()
      .then((res) =>
        setData({
          total: res.data.total || 0,
          referrals: res.data.referrals || [],
          referralCode: res.data.referralCode || '',
        })
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="bg-white border border-brand-border rounded-2xl p-4 sm:p-6 space-y-4 min-w-0 overflow-hidden">
        <div className="min-w-0">
          <h2 className="font-display text-xl sm:text-2xl mb-1">My Referrals</h2>
          <p className="text-sm text-brand-muted break-words">
            Orders placed by customers who used your share link
          </p>
        </div>
        {data.referralCode ? (
          <div className="rounded-xl border border-brand-gold/40 bg-brand-gold/5 px-3 sm:px-4 py-4 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-muted mb-1">
              Your referral number
            </p>
            <p className="font-mono text-xl sm:text-2xl font-semibold text-brand-black tracking-wide break-all">
              {data.referralCode}
            </p>
            <p className="text-xs text-brand-muted mt-1.5 break-words">
              This is your mobile — friends enter it at checkout or open your share link.
            </p>
          </div>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 break-words">
            Add a mobile number to your profile to get a referral code.
          </p>
        )}
        <div>
          <p className="text-3xl font-semibold text-brand-gold">{data.total}</p>
          <p className="text-sm text-brand-muted mt-1">
            {data.total === 1 ? 'referral order' : 'referral orders'}
          </p>
        </div>
      </div>

      {data.referrals.length === 0 ? (
        <p className="text-brand-muted text-sm py-8 text-center border border-dashed border-brand-border rounded-2xl px-3 break-words">
          No referral orders yet. Share products or membership to start earning referrals.
        </p>
      ) : (
        <ul className="space-y-4">
          {data.referrals.map((r) => (
            <li
              key={r._id}
              className="bg-white border border-brand-border rounded-2xl p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="font-medium break-words">{r.buyerName}</p>
                  <p className="text-xs text-brand-muted break-all">{r.buyerMobile}</p>
                </div>
                <div className="text-left sm:text-right min-w-0">
                  <p className="text-sm font-medium break-all">{r.orderNumber}</p>
                  <p className="text-xs text-brand-muted break-words">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <ul className="space-y-2">
                {(r.products || []).map((p, i) => (
                  <li key={i} className="flex gap-3 items-start text-sm min-w-0">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium break-words">{p.name}</p>
                      <p className="text-xs text-brand-muted">
                        Qty {p.quantity} · {formatBDT(p.price)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-brand-border gap-3 min-w-0">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize shrink-0 ${
                    ORDER_STATUS_COLORS[r.status] || 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {r.status}
                </span>
                <span className="font-semibold text-brand-gold shrink-0">
                  {formatBDT(r.total)}
                </span>
              </div>
              <DeliveryTracker status={r.status} compact />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DashboardInner = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
      isActive ? 'bg-brand-gold/15 text-brand-gold' : 'hover:bg-neutral-100 text-brand-black'
    }`;

  return (
    <>
      <Helmet>
        <title>Dashboard — Nogor Car</title>
      </Helmet>
      <div className="pt-6 pb-16 w-full min-w-0 overflow-x-hidden">
        <div className="container-uc px-3 sm:px-6 lg:px-8 w-full min-w-0">
          <h1 className="font-display text-2xl sm:text-4xl mb-2 break-words">
            Hello, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-brand-muted mb-6 sm:mb-8">Manage your account and orders</p>

          <div className="grid lg:grid-cols-4 gap-4 sm:gap-8 min-w-0">
            <aside className="space-y-1 h-fit min-w-0 overflow-x-auto">
              <div className="flex lg:flex-col gap-1 min-w-0">
                <NavLink to="/dashboard" end className={navClass}>
                  <User size={16} className="shrink-0" /> Profile
                </NavLink>
                <NavLink to="/dashboard/orders" className={navClass}>
                  <Package size={16} className="shrink-0" /> My Orders
                </NavLink>
                <NavLink to="/dashboard/referrals" className={navClass}>
                  <Users size={16} className="shrink-0" /> Referrals
                </NavLink>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 shrink-0 lg:w-full"
                >
                  <LogOut size={16} className="shrink-0" /> Logout
                </button>
              </div>
            </aside>
            <div className="lg:col-span-3 min-w-0 overflow-x-hidden">
              <Routes>
                <Route index element={<ProfileTab />} />
                <Route path="orders" element={<OrdersTab />} />
                <Route path="orders/:orderId" element={<OrderDetailTab />} />
                <Route path="referrals" element={<ReferralsTab />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const Dashboard = () => (
  <ProtectedRoute>
    <DashboardInner />
  </ProtectedRoute>
);

export default Dashboard;
