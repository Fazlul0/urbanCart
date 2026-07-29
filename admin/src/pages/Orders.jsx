import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOrders, getOrder, updateOrderStatus } from '../services/api';
import { formatBDT, STATUS_COLORS } from '../utils/helpers';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export const OrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getOrders({
        status: status || undefined,
        search: search || undefined,
        limit: 50,
      });
      setOrders(res.data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Orders</h2>
        <p className="text-sm text-neutral-500">{orders.length} orders</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search order #, name, mobile..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b">
            <tr className="text-left text-neutral-500">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                  Loading...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">
                  No orders
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${o._id}`} className="font-medium text-brand-gold hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p>{o.user?.name || o.deliveryAddress?.fullName}</p>
                    <p className="text-xs text-neutral-500">{o.deliveryAddress?.mobile}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatBDT(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[o.status]}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrder(id)
      .then((res) => {
        setOrder(res.data.order);
        setStatus(res.data.order.status);
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await updateOrderStatus(id, { status, note });
      setOrder(res.data.order);
      setNote('');
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return <p>Order not found</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-brand-black"
      >
        <ArrowLeft size={16} /> Back to Orders
      </button>

      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{order.orderNumber}</h2>
            <p className="text-sm text-neutral-500">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full capitalize h-fit ${STATUS_COLORS[order.status]}`}>
            {order.status}
          </span>
        </div>

        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center text-sm">
              {item.image && (
                <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-neutral-500">
                  {item.quantity} × {formatBDT(item.price)}
                </p>
              </div>
              <p className="font-medium">{formatBDT(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 text-sm border-t pt-4">
          <div>
            <h3 className="font-medium mb-2">Customer & Delivery</h3>
            <p>{order.deliveryAddress.fullName}</p>
            <p className="text-neutral-500">{order.deliveryAddress.mobile}</p>
            <p className="text-neutral-500">
              {order.deliveryAddress.fullAddress}, {order.deliveryAddress.area},{' '}
              {order.deliveryAddress.district}
            </p>
            {order.user && (
              <p className="text-neutral-500 mt-1">{order.user.email}</p>
            )}
            {order.orderNotes && (
              <p className="mt-2 text-neutral-500">Note: {order.orderNotes}</p>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span>{formatBDT(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Delivery</span>
              <span>{formatBDT(order.deliveryCharge)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2">
              <span>Total</span>
              <span className="text-brand-gold">{formatBDT(order.total)}</span>
            </div>
            <p className="text-neutral-500 pt-1">COD</p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h3 className="font-medium">Update Status</h3>
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input-field w-auto"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              className="input-field flex-1 min-w-[160px]"
            />
            <button onClick={handleUpdate} disabled={saving} className="btn-primary">
              {saving ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Orders = () => <OrdersList />;
export default Orders;
