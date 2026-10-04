import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid, mapProduct, resolveDeliveryCharge } from '../lib/helpers';
import { protect } from '../middleware/auth';

type Vars = { user: AuthUser };
const cart = new Hono<{ Bindings: Env; Variables: Vars }>();

async function getOrCreateCart(db: D1Database, userId: string) {
  let row = await db.prepare('SELECT * FROM carts WHERE user_id = ?').bind(userId).first<any>();
  if (!row) {
    const id = uid();
    await db.prepare('INSERT INTO carts (id, user_id) VALUES (?, ?)').bind(id, userId).run();
    row = { id, user_id: userId };
  }
  return row;
}

function unitLabel(unitType: string) {
  if (unitType === 'kg') return 'kg';
  if (unitType === 'g') return 'g';
  return 'pcs';
}

async function buildCartResponse(db: D1Database, env: Env, cartId: string) {
  const { results } = await db
    .prepare(
      `SELECT ci.id as item_id, ci.quantity, p.*, c.id as c_id, c.name as c_name, c.slug as c_slug, c.type as c_type
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ci.cart_id = ? AND p.is_active = 1`
    )
    .bind(cartId)
    .all();

  const items = (results || []).map((row: any) => {
    const product = mapProduct(row, {
      id: row.c_id,
      name: row.c_name,
      slug: row.c_slug,
      type: row.c_type || 'general',
    });
    return {
      _id: row.item_id,
      product,
      quantity: Number(row.quantity),
      lineTotal: (product?.price || 0) * Number(row.quantity),
    };
  });

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const hasFreeDelivery = items.some((i) => i.product?.freeDelivery);
  const charge = !items.length || hasFreeDelivery ? 0 : await resolveDeliveryCharge(db, env);

  return {
    items,
    subtotal,
    deliveryCharge: charge,
    freeDelivery: hasFreeDelivery,
    total: subtotal + charge,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
  };
}

function validateQty(product: any, quantity: number) {
  const minOrder = Number(product.min_order ?? 1) || 1;
  const unit = product.unit_type || 'piece';
  if (quantity < minOrder) {
    return `Minimum order for ${product.name} is ${minOrder} ${unitLabel(unit)}`;
  }
  return null;
}

cart.use('*', protect);

cart.get('/', async (c) => {
  const user = c.get('user');
  const cartRow = await getOrCreateCart(c.env.DB, user.id);
  const data = await buildCartResponse(c.env.DB, c.env, cartRow.id);
  return c.json({ success: true, cart: data });
});

cart.post('/add', async (c) => {
  const user = c.get('user');
  const { productId, quantity = 1 } = await c.req.json<{ productId: string; quantity?: number }>();
  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1')
    .bind(productId)
    .first<any>();
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
  if (product.availability === 'out_of_stock') {
    return c.json({ success: false, message: 'Product is out of stock' }, 400);
  }

  const cartRow = await getOrCreateCart(c.env.DB, user.id);
  const existing = await c.env.DB.prepare(
    'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?'
  )
    .bind(cartRow.id, productId)
    .first<any>();

  const addQty = Number(quantity);
  const nextQty = existing ? Number(existing.quantity) + addQty : addQty;
  const err = validateQty(product, nextQty);
  if (err) return c.json({ success: false, message: err }, 400);

  if (existing) {
    await c.env.DB.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?')
      .bind(nextQty, existing.id)
      .run();
  } else {
    await c.env.DB.prepare(
      'INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)'
    )
      .bind(uid(), cartRow.id, productId, nextQty)
      .run();
  }

  const data = await buildCartResponse(c.env.DB, c.env, cartRow.id);
  return c.json({ success: true, message: 'Added to cart', cart: data });
});

cart.put('/update', async (c) => {
  const user = c.get('user');
  const { productId, quantity } = await c.req.json<{ productId: string; quantity: number }>();
  const cartRow = await getOrCreateCart(c.env.DB, user.id);

  if (Number(quantity) <= 0) {
    await c.env.DB.prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?')
      .bind(cartRow.id, productId)
      .run();
  } else {
    const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?')
      .bind(productId)
      .first<any>();
    if (!product) return c.json({ success: false, message: 'Product not found' }, 404);
    const err = validateQty(product, Number(quantity));
    if (err) return c.json({ success: false, message: err }, 400);

    const existing = await c.env.DB.prepare(
      'SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ?'
    )
      .bind(cartRow.id, productId)
      .first();
    if (!existing) return c.json({ success: false, message: 'Item not in cart' }, 404);
    await c.env.DB.prepare('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?')
      .bind(Number(quantity), cartRow.id, productId)
      .run();
  }

  const data = await buildCartResponse(c.env.DB, c.env, cartRow.id);
  return c.json({ success: true, message: 'Cart updated', cart: data });
});

cart.delete('/clear', async (c) => {
  const user = c.get('user');
  const cartRow = await getOrCreateCart(c.env.DB, user.id);
  await c.env.DB.prepare('DELETE FROM cart_items WHERE cart_id = ?').bind(cartRow.id).run();
  return c.json({
    success: true,
    message: 'Cart cleared',
    cart: { items: [], subtotal: 0, deliveryCharge: 0, freeDelivery: false, total: 0, itemCount: 0 },
  });
});

cart.delete('/:productId', async (c) => {
  const user = c.get('user');
  const cartRow = await getOrCreateCart(c.env.DB, user.id);
  await c.env.DB.prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?')
    .bind(cartRow.id, c.req.param('productId'))
    .run();
  const data = await buildCartResponse(c.env.DB, c.env, cartRow.id);
  return c.json({ success: true, message: 'Item removed', cart: data });
});

export default cart;
