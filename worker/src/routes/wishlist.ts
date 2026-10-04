import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { mapProduct } from '../lib/helpers';
import { protect } from '../middleware/auth';

type Vars = { user: AuthUser };
const wishlist = new Hono<{ Bindings: Env; Variables: Vars }>();

wishlist.use('*', protect);

async function ensureProduct(db: D1Database, productId: string) {
  return db
    .prepare('SELECT id FROM products WHERE id = ? AND is_active = 1')
    .bind(productId)
    .first<{ id: string }>();
}

async function loadItems(db: D1Database, userId: string) {
  const { results } = await db
    .prepare(
      `SELECT w.id as wishlist_id, w.product_id, w.created_at as saved_at,
              p.*, c.id as c_id, c.name as c_name, c.slug as c_slug, c.type as c_type
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`
    )
    .bind(userId)
    .all();

  const items = (results || []).map((row: any) => ({
    wishlistId: row.wishlist_id,
    savedAt: row.saved_at,
    product: mapProduct(row, {
      id: row.c_id,
      name: row.c_name,
      slug: row.c_slug,
      type: row.c_type || 'general',
    }),
  }));

  const productIds = (results || []).map((r: any) => r.product_id);
  return { items, productIds };
}

wishlist.get('/', async (c) => {
  const user = c.get('user');
  const { items, productIds } = await loadItems(c.env.DB, user.id);
  return c.json({
    success: true,
    items,
    productIds,
    count: items.length,
  });
});

wishlist.post('/', async (c) => {
  const user = c.get('user');
  const { productId } = await c.req.json<{ productId?: string }>();
  if (!productId) {
    return c.json({ success: false, message: 'productId is required' }, 400);
  }

  const product = await ensureProduct(c.env.DB, productId);
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);

  // Idempotent save: no-op if already wishlisted.
  await c.env.DB
    .prepare(
      `INSERT OR IGNORE INTO wishlists (id, user_id, product_id)
       VALUES (?, ?, ?)`
    )
    .bind(crypto.randomUUID(), user.id, productId)
    .run();

  const { items, productIds } = await loadItems(c.env.DB, user.id);
  return c.json({
    success: true,
    message: 'Saved to wishlist',
    items,
    productIds,
    count: items.length,
  });
});

wishlist.delete('/:productId', async (c) => {
  const user = c.get('user');
  const productId = c.req.param('productId');
  const result = await c.env.DB
    .prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?')
    .bind(user.id, productId)
    .run();

  const { items, productIds } = await loadItems(c.env.DB, user.id);
  return c.json({
    success: true,
    message: result.meta.changes ? 'Removed from wishlist' : 'Already not in wishlist',
    removed: !!result.meta.changes,
    items,
    productIds,
    count: items.length,
  });
});

export default wishlist;
