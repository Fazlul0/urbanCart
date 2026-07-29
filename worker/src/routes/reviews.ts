import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid, mapReview } from '../lib/helpers';
import { protect, adminOnly } from '../middleware/auth';

type Vars = { user: AuthUser };
const reviews = new Hono<{ Bindings: Env; Variables: Vars }>();

async function updateProductRating(db: D1Database, productId: string) {
  const stats = await db
    .prepare(
      `SELECT AVG(rating) as avgRating, COUNT(*) as total FROM reviews WHERE product_id = ? AND is_hidden = 0`
    )
    .bind(productId)
    .first<{ avgRating: number | null; total: number }>();

  const avg = stats?.avgRating ? Math.round(stats.avgRating * 10) / 10 : 0;
  const total = stats?.total || 0;
  await db
    .prepare(`UPDATE products SET rating = ?, total_reviews = ? WHERE id = ?`)
    .bind(avg, total, productId)
    .run();
}

reviews.get('/product/:productId', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT r.*, u.name as user_name FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ? AND r.is_hidden = 0
     ORDER BY r.created_at DESC`
  )
    .bind(c.req.param('productId'))
    .all();

  return c.json({
    success: true,
    reviews: (results || []).map((r: any) =>
      mapReview(r, { user: { name: r.user_name || 'Customer' } })
    ),
  });
});

reviews.post('/', protect, async (c) => {
  const user = c.get('user');
  const { productId, rating, comment } = await c.req.json<{
    productId: string;
    rating: number;
    comment: string;
  }>();

  if (!productId || !rating || !comment) {
    return c.json({ success: false, message: 'Missing review fields' }, 400);
  }
  if (rating < 1 || rating > 5) {
    return c.json({ success: false, message: 'Rating must be 1-5' }, 400);
  }

  const product = await c.env.DB.prepare('SELECT id FROM products WHERE id = ?')
    .bind(productId)
    .first();
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);

  const purchased = await c.env.DB.prepare(
    `SELECT id FROM orders WHERE user_id = ? AND status = 'delivered' AND items_json LIKE ? LIMIT 1`
  )
    .bind(user.id, `%"product":"${productId}"%`)
    .first();

  if (!purchased) {
    return c.json(
      {
        success: false,
        message: 'You can only review products you have purchased and received',
      },
      403
    );
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?'
  )
    .bind(user.id, productId)
    .first();
  if (existing) {
    return c.json({ success: false, message: 'You already reviewed this product' }, 400);
  }

  const id = uid();
  await c.env.DB.prepare(
    `INSERT INTO reviews (id, user_id, product_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, user.id, productId, purchased.id, rating, comment.trim())
    .run();

  await updateProductRating(c.env.DB, productId);

  return c.json(
    {
      success: true,
      message: 'Review submitted',
      review: mapReview(
        await c.env.DB.prepare('SELECT * FROM reviews WHERE id = ?').bind(id).first(),
        { user: { name: user.name } }
      ),
    },
    201
  );
});

reviews.get('/', protect, adminOnly, async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(50, Number(c.req.query('limit') || 20));
  const offset = (page - 1) * limit;

  const total =
    (await c.env.DB.prepare('SELECT COUNT(*) as total FROM reviews').first<{ total: number }>())
      ?.total || 0;

  const { results } = await c.env.DB.prepare(
    `SELECT r.*, u.name as user_name, u.email as user_email, p.name as product_name
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     LEFT JOIN products p ON p.id = r.product_id
     ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  return c.json({
    success: true,
    reviews: (results || []).map((r: any) =>
      mapReview(r, {
        user: { name: r.user_name, email: r.user_email },
        product: { name: r.product_name },
      })
    ),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

reviews.put('/:id/hide', protect, adminOnly, async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM reviews WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!row) return c.json({ success: false, message: 'Review not found' }, 404);

  const hidden = row.is_hidden ? 0 : 1;
  await c.env.DB.prepare(`UPDATE reviews SET is_hidden = ? WHERE id = ?`).bind(hidden, row.id).run();
  await updateProductRating(c.env.DB, row.product_id);

  return c.json({
    success: true,
    message: hidden ? 'Review hidden' : 'Review visible',
    review: mapReview({ ...row, is_hidden: hidden }),
  });
});

reviews.delete('/:id', protect, adminOnly, async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM reviews WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!row) return c.json({ success: false, message: 'Review not found' }, 404);

  await c.env.DB.prepare('DELETE FROM reviews WHERE id = ?').bind(row.id).run();
  await updateProductRating(c.env.DB, row.product_id);
  return c.json({ success: true, message: 'Review deleted' });
});

export default reviews;
