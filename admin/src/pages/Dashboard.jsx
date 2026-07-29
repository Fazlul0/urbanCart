import { useEffect, useState } from 'react';
import {
  Package,
  ShoppingBag,
  Users,
  Clock,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getStats } from '../services/api';
import { formatBDT, STATUS_COLORS } from '../utils/helpers';
import { Link } from 'react-router-dom';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const cards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Products', value: stats.totalProducts, icon: Package, color: 'bg-purple-50 text-purple-600' },
    { label: 'Users', value: stats.totalUsers, icon: Users, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'Pending', value: stats.pendingOrders, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Delivered', value: stats.completedOrders, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'Revenue', value: formatBDT(stats.revenue), icon: DollarSign, color: 'bg-brand-gold/15 text-brand-gold' },
  ];

  const chartData = (data?.monthlyOrders || []).map((m) => ({
    name: MONTHS[(m._id.month || 1) - 1],
    orders: m.orders,
    revenue: m.revenue,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-sm text-neutral-500 mt-1">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon size={20} />
            </div>
            <p className="text-xs text-neutral-500">{c.label}</p>
            <p className="text-xl font-semibold mt-0.5">{c.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="card p-5 lg:col-span-3">
          <h3 className="font-medium mb-4">Orders (Last 6 Months)</h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-neutral-500 py-12 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#C9A227" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Recent Orders</h3>
            <Link to="/orders" className="text-xs text-brand-gold hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {(data?.recentOrders || []).slice(0, 6).map((o) => (
              <Link
                key={o._id}
                to={`/orders/${o._id}`}
                className="flex items-center justify-between gap-2 text-sm hover:bg-neutral-50 rounded-lg p-2 -mx-2"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{o.orderNumber}</p>
                  <p className="text-xs text-neutral-500 truncate">{o.user?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[o.status]}`}>
                    {o.status}
                  </span>
                  <p className="text-xs font-medium mt-1">{formatBDT(o.total)}</p>
                </div>
              </Link>
            ))}
            {!data?.recentOrders?.length && (
              <p className="text-sm text-neutral-500 text-center py-8">No orders yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
