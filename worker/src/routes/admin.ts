import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { mapUser, mapOrder, mapProduct } from '../lib/helpers';
import { protect, adminOnly } from '../middleware/auth';

type Vars = { user: AuthUser };
const admin = new Hono<{ Bindings: Env; Variables: Vars }>();

admin.use('*', protect, adminOnly);

admin.get('/stats', async (c) => {
  const db = c.env.DB;
  const [
    totalOrders,
    totalProducts,
    totalUsers,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalReviews,
    revenue,
    recent,
    monthly,
  ] = await Promise.all([
    db.prepare('SELECT COUNT(*) as n FROM orders').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) as n FROM products WHERE is_active = 1').first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM users WHERE role = 'user'`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM orders WHERE status = 'pending'`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM orders WHERE status = 'delivered'`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM orders WHERE status = 'cancelled'`).first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) as n FROM reviews').first<{ n: number }>(),
    db
      .prepare(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'`)
      .first<{ total: number }>(),
    db
      .prepare(
        `SELECT o.*, u.name as u_name, u.email as u_email, u.id as u_id
         FROM orders o LEFT JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC LIMIT 8`
      )
      .all(),
    db
      .prepare(
        `SELECT strftime('%Y', created_at) as year, strftime('%m', created_at) as month,
                COUNT(*) as orders, SUM(total) as revenue
         FROM orders
         WHERE status != 'cancelled' AND created_at >= datetime('now', '-5 months')
         GROUP BY year, month
         ORDER BY year, month`
      )
      .all(),
  ]);

  return c.json({
    success: true,
    stats: {
      totalOrders: totalOrders?.n || 0,
      totalProducts: totalProducts?.n || 0,
      totalUsers: totalUsers?.n || 0,
      pendingOrders: pendingOrders?.n || 0,
      completedOrders: completedOrders?.n || 0,
      cancelledOrders: cancelledOrders?.n || 0,
      totalReviews: totalReviews?.n || 0,
      revenue: revenue?.total || 0,
    },
    recentOrders: (recent.results || []).map((r: any) =>
      mapOrder(r, { id: r.u_id, name: r.u_name, email: r.u_email })
    ),
    monthlyOrders: (monthly.results || []).map((m: any) => ({
      _id: { year: Number(m.year), month: Number(m.month) },
      orders: m.orders,
      revenue: m.revenue,
    })),
  });
});

admin.get('/products', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(50, Number(c.req.query('limit') || 20));
  const offset = (page - 1) * limit;
  const search = c.req.query('search');

  let where = '1=1';
  const binds: unknown[] = [];
  if (search) {
    where += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    binds.push(`%${search}%`, `%${search}%`);
  }

  const total =
    (
      await c.env.DB.prepare(`SELECT COUNT(*) as total FROM products p WHERE ${where}`)
        .bind(...binds)
        .first<{ total: number }>()
    )?.total || 0;

  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.id as c_id, c.name as c_name, c.slug as c_slug
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${where}
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...binds, limit, offset)
    .all();

  return c.json({
    success: true,
    products: (results || []).map((r: any) =>
      mapProduct(r, { id: r.c_id, name: r.c_name, slug: r.c_slug })
    ),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

admin.get('/users', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(50, Number(c.req.query('limit') || 20));
  const offset = (page - 1) * limit;
  const search = c.req.query('search');

  let where = `role = 'user'`;
  const binds: unknown[] = [];
  if (search) {
    where += ' AND (name LIKE ? OR email LIKE ? OR mobile LIKE ?)';
    const s = `%${search}%`;
    binds.push(s, s, s);
  }

  const total =
    (
      await c.env.DB.prepare(`SELECT COUNT(*) as total FROM users WHERE ${where}`)
        .bind(...binds)
        .first<{ total: number }>()
    )?.total || 0;

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM users WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...binds, limit, offset)
    .all();

  return c.json({
    success: true,
    users: (results || []).map((u) => mapUser(u)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

admin.put('/users/:id/ban', async (c) => {
  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ? AND role = 'user'`)
    .bind(c.req.param('id'))
    .first<any>();
  if (!user) return c.json({ success: false, message: 'User not found' }, 404);

  const banned = user.is_banned ? 0 : 1;
  await c.env.DB.prepare(`UPDATE users SET is_banned = ? WHERE id = ?`).bind(banned, user.id).run();
  return c.json({
    success: true,
    message: banned ? 'User banned' : 'User unbanned',
    user: mapUser({ ...user, is_banned: banned }),
  });
});

admin.delete('/users/:id', async (c) => {
  const result = await c.env.DB.prepare(`DELETE FROM users WHERE id = ? AND role = 'user'`)
    .bind(c.req.param('id'))
    .run();
  if (!result.meta.changes) return c.json({ success: false, message: 'User not found' }, 404);
  return c.json({ success: true, message: 'User deleted' });
});

export default admin;
