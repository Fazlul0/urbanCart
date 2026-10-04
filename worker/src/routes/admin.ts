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
    pendingMembershipApps,
    pendingLostCardApps,
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
    db
      .prepare(`SELECT COUNT(*) as n FROM membership_applications WHERE status = 'pending'`)
      .first<{ n: number }>(),
    db
      .prepare(`SELECT COUNT(*) as n FROM lost_card_applications WHERE status = 'pending'`)
      .first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM orders WHERE status = 'delivered'`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) as n FROM orders WHERE status = 'cancelled'`).first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) as n FROM reviews').first<{ n: number }>(),
    db
      .prepare(`SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'`)
      .first<{ total: number }>(),
    db
      .prepare(
        `SELECT o.*, u.name as u_name, u.email as u_email, u.id as u_id, u.mobile as u_mobile, u.referred_by as u_referred_by
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
      pendingMembershipApps: pendingMembershipApps?.n || 0,
      pendingLostCardApps: pendingLostCardApps?.n || 0,
      completedOrders: completedOrders?.n || 0,
      cancelledOrders: cancelledOrders?.n || 0,
      totalReviews: totalReviews?.n || 0,
      revenue: revenue?.total || 0,
    },
    recentOrders: (recent.results || []).map((r: any) =>
      mapOrder(r, {
        id: r.u_id,
        name: r.u_name,
        email: r.u_email,
        mobile: r.u_mobile,
        referred_by: r.u_referred_by,
      })
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
  const limit = Math.min(200, Math.max(1, Number(c.req.query('limit') || 20)));
  const offset = (page - 1) * limit;
  const search = c.req.query('search');
  const type = c.req.query('type');

  let where = '1=1';
  const binds: unknown[] = [];
  if (search) {
    where += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    binds.push(`%${search}%`, `%${search}%`);
  }
  if (type) {
    where += ' AND p.product_type = ?';
    binds.push(type);
  }

  const total =
    (
      await c.env.DB.prepare(`SELECT COUNT(*) as total FROM products p WHERE ${where}`)
        .bind(...binds)
        .first<{ total: number }>()
    )?.total || 0;

  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.id as c_id, c.name as c_name, c.slug as c_slug, c.type as c_type
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${where}
     ORDER BY p.sort_order ASC, p.created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...binds, limit, offset)
    .all();

  return c.json({
    success: true,
    products: (results || []).map((r: any) =>
      mapProduct(
        r,
        { id: r.c_id, name: r.c_name, slug: r.c_slug, type: r.c_type || 'general' },
        { admin: true }
      )
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
    where += ' AND (name LIKE ? OR email LIKE ? OR mobile LIKE ? OR referred_by LIKE ?)';
    const s = `%${search}%`;
    binds.push(s, s, s, s);
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
  const id = c.req.param('id');
  const user = await c.env.DB.prepare(`SELECT id FROM users WHERE id = ? AND role = 'user'`)
    .bind(id)
    .first<{ id: string }>();
  if (!user) return c.json({ success: false, message: 'User not found' }, 404);

  try {
    // Clear FK blockers first (orders / membership / lost-card), then user.
    // carts, reviews, wishlists, password_resets cascade from users.
    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE reviews SET order_id = NULL WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)`
      ).bind(id),
      c.env.DB.prepare(`DELETE FROM lost_card_applications WHERE user_id = ?`).bind(id),
      c.env.DB.prepare(`DELETE FROM membership_applications WHERE user_id = ?`).bind(id),
      c.env.DB.prepare(`DELETE FROM orders WHERE user_id = ?`).bind(id),
      c.env.DB.prepare(`DELETE FROM users WHERE id = ? AND role = 'user'`).bind(id),
    ]);
  } catch (err: any) {
    const msg = String(err?.message || 'Delete failed');
    return c.json(
      {
        success: false,
        message: msg.includes('FOREIGN KEY')
          ? 'Cannot delete user: related records still block removal. Try again or contact support.'
          : `Failed to delete user: ${msg}`,
      },
      400
    );
  }

  const stillThere = await c.env.DB.prepare(`SELECT id FROM users WHERE id = ?`)
    .bind(id)
    .first();
  if (stillThere) {
    return c.json({ success: false, message: 'User could not be deleted' }, 400);
  }

  return c.json({ success: true, message: 'User deleted' });
});

admin.get('/wishlist/stats', async (c) => {
  const db = c.env.DB;
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') || 10)));

  const [totalRow, uniqueUsersRow, topRaw] = await Promise.all([
    db.prepare('SELECT COUNT(*) as n FROM wishlists').first<{ n: number }>(),
    db
      .prepare('SELECT COUNT(DISTINCT user_id) as n FROM wishlists')
      .first<{ n: number }>(),
    db
      .prepare(
        `SELECT w.product_id as productId, COUNT(*) as saves,
                p.id as p_id, p.name as p_name, p.price as p_price,
                p.images_json as p_images_json, p.availability as p_availability,
                c.id as c_id, c.name as c_name, c.slug as c_slug, c.type as c_type
         FROM wishlists w
         JOIN products p ON p.id = w.product_id
         LEFT JOIN categories c ON c.id = p.category_id
         GROUP BY w.product_id
         ORDER BY saves DESC, p.name ASC
         LIMIT ?`
      )
      .bind(limit)
      .all(),
  ]);

  const topProducts = (topRaw.results || []).map((row: any) => ({
    saves: row.saves,
    product: mapProduct(
      {
        id: row.p_id,
        name: row.p_name,
        price: row.p_price,
        images_json: row.p_images_json,
        availability: row.p_availability,
      },
      { id: row.c_id, name: row.c_name, slug: row.c_slug, type: row.c_type || 'general' }
    ),
  }));

  return c.json({
    success: true,
    stats: {
      totalSaves: totalRow?.n || 0,
      uniqueUsers: uniqueUsersRow?.n || 0,
      totalProducts: (topRaw.results || []).length,
    },
    topProducts,
  });
});

export default admin;
