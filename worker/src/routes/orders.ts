import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid, mapOrder, deliveryCharge, parseJson } from '../lib/helpers';
import { protect, adminOnly } from '../middleware/auth';

type Vars = { user: AuthUser };
const orders = new Hono<{ Bindings: Env; Variables: Vars }>();

orders.post('/', protect, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<any>();
  const addr = body.deliveryAddress;
  if (!addr?.fullName || !addr?.mobile || !addr?.fullAddress || !addr?.district || !addr?.area) {
    return c.json({ success: false, message: 'Delivery address incomplete' }, 400);
  }

  const cart = await c.env.DB.prepare('SELECT * FROM carts WHERE user_id = ?')
    .bind(user.id)
    .first<any>();
  if (!cart) return c.json({ success: false, message: 'Cart is empty' }, 400);

  const { results } = await c.env.DB.prepare(
    `SELECT ci.quantity, p.* FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?`
  )
    .bind(cart.id)
    .all();

  if (!results?.length) return c.json({ success: false, message: 'Cart is empty' }, 400);

  const items: any[] = [];
  let subtotal = 0;
  let hasFreeDelivery = false;
  for (const row of results as any[]) {
    if (!row.is_active) {
      return c.json({ success: false, message: `Product unavailable: ${row.name}` }, 400);
    }
    if (row.availability === 'out_of_stock') {
      return c.json({ success: false, message: `${row.name} is out of stock` }, 400);
    }
    const minOrder = Number(row.min_order ?? 1) || 1;
    if (Number(row.quantity) < minOrder) {
      return c.json(
        {
          success: false,
          message: `Minimum order for ${row.name} is ${minOrder} ${row.unit_type || 'piece'}`,
        },
        400
      );
    }
    if (row.free_delivery) hasFreeDelivery = true;
    const images = parseJson<any[]>(row.images_json, []);
    const thumb = images.find((i) => i.isThumbnail) || images[0];
    items.push({
      product: row.id,
      name: row.name,
      image: thumb?.url || '',
      price: row.price,
      quantity: row.quantity,
      unitType: row.unit_type || 'piece',
      freeDelivery: !!row.free_delivery,
    });
    subtotal += row.price * row.quantity;
  }

  const charge = hasFreeDelivery ? 0 : deliveryCharge(c.env);
  const id = uid();
  const orderNumber = `UC${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 900 + 100)}`;
  const history = [{ status: 'pending', note: 'Order placed', updatedAt: new Date().toISOString() }];

  await c.env.DB.prepare(
    `INSERT INTO orders
     (id, user_id, order_number, items_json, delivery_address_json, order_notes, payment_method, subtotal, delivery_charge, total, status, status_history_json)
     VALUES (?, ?, ?, ?, ?, ?, 'cash_on_delivery', ?, ?, ?, 'pending', ?)`
  )
    .bind(
      id,
      user.id,
      orderNumber,
      JSON.stringify(items),
      JSON.stringify(addr),
      body.orderNotes || null,
      subtotal,
      charge,
      subtotal + charge,
      JSON.stringify(history)
    )
    .run();

  for (const item of items) {
    await c.env.DB.prepare(
      `UPDATE products SET sold_count = sold_count + ?, stock_quantity = MAX(stock_quantity - ?, 0) WHERE id = ?`
    )
      .bind(item.quantity, item.quantity, item.product)
      .run();
  }

  await c.env.DB.prepare('DELETE FROM cart_items WHERE cart_id = ?').bind(cart.id).run();

  const order = mapOrder(
    await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first(),
    user
  );
  return c.json({ success: true, message: 'Order placed successfully', order }, 201);
});

orders.get('/my', protect, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`
  )
    .bind(user.id)
    .all();
  return c.json({ success: true, orders: (results || []).map((r) => mapOrder(r)) });
});

orders.get('/my/:id', protect, async (c) => {
  const user = c.get('user');
  const row = await c.env.DB.prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`)
    .bind(c.req.param('id'), user.id)
    .first();
  if (!row) return c.json({ success: false, message: 'Order not found' }, 404);
  return c.json({ success: true, order: mapOrder(row) });
});

orders.get('/', protect, adminOnly, async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(50, Number(c.req.query('limit') || 20));
  const offset = (page - 1) * limit;
  const status = c.req.query('status');
  const search = c.req.query('search');

  const where: string[] = ['1=1'];
  const binds: unknown[] = [];
  if (status) {
    where.push('o.status = ?');
    binds.push(status);
  }
  if (search) {
    where.push(
      `(o.order_number LIKE ? OR o.delivery_address_json LIKE ?)`
    );
    const s = `%${search}%`;
    binds.push(s, s);
  }

  const whereSql = where.join(' AND ');
  const total =
    (
      await c.env.DB.prepare(`SELECT COUNT(*) as total FROM orders o WHERE ${whereSql}`)
        .bind(...binds)
        .first<{ total: number }>()
    )?.total || 0;

  const { results } = await c.env.DB.prepare(
    `SELECT o.*, u.name as u_name, u.email as u_email, u.mobile as u_mobile, u.id as u_id
     FROM orders o LEFT JOIN users u ON u.id = o.user_id
     WHERE ${whereSql}
     ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...binds, limit, offset)
    .all();

  return c.json({
    success: true,
    orders: (results || []).map((r: any) =>
      mapOrder(r, { id: r.u_id, name: r.u_name, email: r.u_email, mobile: r.u_mobile })
    ),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

orders.get('/:id', protect, adminOnly, async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT o.*, u.name as u_name, u.email as u_email, u.mobile as u_mobile, u.id as u_id
     FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`
  )
    .bind(c.req.param('id'))
    .first<any>();
  if (!row) return c.json({ success: false, message: 'Order not found' }, 404);
  return c.json({
    success: true,
    order: mapOrder(row, { id: row.u_id, name: row.u_name, email: row.u_email, mobile: row.u_mobile }),
  });
});

orders.put('/:id/status', protect, adminOnly, async (c) => {
  const { status, note } = await c.req.json<{ status: string; note?: string }>();
  const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return c.json({ success: false, message: 'Invalid status' }, 400);

  const row = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!row) return c.json({ success: false, message: 'Order not found' }, 404);

  const history = parseJson<any[]>(row.status_history_json, []);
  history.push({ status, note: note || `Status changed to ${status}`, updatedAt: new Date().toISOString() });

  await c.env.DB.prepare(
    `UPDATE orders SET status = ?, status_history_json = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(status, JSON.stringify(history), row.id)
    .run();

  const updated = await c.env.DB.prepare(
    `SELECT o.*, u.name as u_name, u.email as u_email, u.mobile as u_mobile, u.id as u_id
     FROM orders o LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`
  )
    .bind(row.id)
    .first<any>();

  return c.json({
    success: true,
    message: 'Order status updated',
    order: mapOrder(updated, {
      id: updated.u_id,
      name: updated.u_name,
      email: updated.u_email,
      mobile: updated.u_mobile,
    }),
  });
});

export default orders;
