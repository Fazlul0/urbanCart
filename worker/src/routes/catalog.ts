import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid, mapProduct, mapCategory, slugify } from '../lib/helpers';
import { protect, adminOnly } from '../middleware/auth';

type Vars = { user: AuthUser };
const products = new Hono<{ Bindings: Env; Variables: Vars }>();
const categories = new Hono<{ Bindings: Env; Variables: Vars }>();

async function getCategory(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
}

async function productWithCategory(db: D1Database, row: any) {
  const cat = row ? await getCategory(db, row.category_id) : null;
  return mapProduct(row, cat);
}

function catFromJoin(row: any) {
  return row.c_id
    ? { id: row.c_id, name: row.c_name, slug: row.c_slug, type: row.c_type || 'general' }
    : null;
}

products.get('/', async (c) => {
  const q = c.req.query();
  const page = Math.max(1, Number(q.page || 1));
  const limit = Math.min(50, Math.max(1, Number(q.limit || 12)));
  const offset = (page - 1) * limit;

  const where: string[] = ['p.is_active = 1'];
  const binds: unknown[] = [];

  if (q.category) {
    where.push('p.category_id = ?');
    binds.push(q.category);
  }
  if (q.type) {
    where.push('p.product_type = ?');
    binds.push(q.type);
  }
  if (q.freeDelivery === 'true') {
    where.push('p.free_delivery = 1');
  }
  if (q.availability) {
    where.push('p.availability = ?');
    binds.push(q.availability);
  }
  if (q.featured === 'true') where.push('p.featured = 1');
  if (q.minPrice) {
    where.push('p.price >= ?');
    binds.push(Number(q.minPrice));
  }
  if (q.maxPrice) {
    where.push('p.price <= ?');
    binds.push(Number(q.maxPrice));
  }
  if (q.search) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.tags_json LIKE ?)');
    const s = `%${q.search}%`;
    binds.push(s, s, s);
  }

  let orderBy = 'p.created_at DESC';
  switch (q.sort) {
    case 'price_asc':
      orderBy = 'p.price ASC';
      break;
    case 'price_desc':
      orderBy = 'p.price DESC';
      break;
    case 'rating':
      orderBy = 'p.rating DESC';
      break;
    case 'bestselling':
      orderBy = 'p.sold_count DESC';
      break;
  }

  const whereSql = where.join(' AND ');
  const countRow = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM products p WHERE ${whereSql}`)
    .bind(...binds)
    .first<{ total: number }>();
  const total = countRow?.total || 0;

  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.id as c_id, c.name as c_name, c.slug as c_slug, c.type as c_type
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${whereSql}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`
  )
    .bind(...binds, limit, offset)
    .all();

  const list = (results || []).map((row: any) => mapProduct(row, catFromJoin(row)));

  return c.json({
    success: true,
    products: list,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

products.get('/:id/related', async (c) => {
  const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!product) return c.json({ success: false, message: 'Product not found' }, 404);

  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.id as c_id, c.name as c_name, c.slug as c_slug, c.type as c_type
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1 LIMIT 4`
  )
    .bind(product.category_id, product.id)
    .all();

  return c.json({
    success: true,
    products: (results || []).map((row: any) => mapProduct(row, catFromJoin(row))),
  });
});

products.get('/:id', async (c) => {
  const row = await c.env.DB.prepare(
    `SELECT p.*, c.id as c_id, c.name as c_name, c.slug as c_slug, c.type as c_type
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?`
  )
    .bind(c.req.param('id'))
    .first<any>();

  if (!row || !row.is_active) {
    return c.json({ success: false, message: 'Product not found' }, 404);
  }

  return c.json({
    success: true,
    product: mapProduct(row, catFromJoin(row)),
  });
});

products.post('/', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const id = uid();
  const productType = body.productType === 'food' ? 'food' : 'general';
  const unitType = ['piece', 'kg', 'g'].includes(body.unitType) ? body.unitType : 'piece';
  const minOrder = Math.max(0.01, Number(body.minOrder ?? 1));

  await c.env.DB.prepare(
    `INSERT INTO products
     (id, name, description, price, category_id, images_json, availability, stock_quantity,
      tags_json, specifications_json, featured, is_active, product_type, unit_type, min_order, free_delivery)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)`
  )
    .bind(
      id,
      body.name,
      body.description,
      Number(body.price),
      body.category,
      JSON.stringify(body.images || []),
      body.availability || 'in_stock',
      Number(body.stockQuantity || 0),
      JSON.stringify(body.tags || []),
      JSON.stringify(body.specifications || {}),
      body.featured ? 1 : 0,
      productType,
      unitType,
      minOrder,
      body.freeDelivery ? 1 : 0
    )
    .run();

  const product = await productWithCategory(
    c.env.DB,
    await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
  );
  return c.json({ success: true, message: 'Product created', product }, 201);
});

products.put('/:id', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const existing = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!existing) return c.json({ success: false, message: 'Product not found' }, 404);

  const productType =
    body.productType != null
      ? body.productType === 'food'
        ? 'food'
        : 'general'
      : existing.product_type || 'general';
  const unitType =
    body.unitType != null && ['piece', 'kg', 'g'].includes(body.unitType)
      ? body.unitType
      : existing.unit_type || 'piece';
  const minOrder =
    body.minOrder != null ? Math.max(0.01, Number(body.minOrder)) : Number(existing.min_order ?? 1);

  await c.env.DB.prepare(
    `UPDATE products SET
      name = ?, description = ?, price = ?, category_id = ?, images_json = ?,
      availability = ?, stock_quantity = ?, tags_json = ?, specifications_json = ?,
      featured = ?, is_active = ?, product_type = ?, unit_type = ?, min_order = ?,
      free_delivery = ?, updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      body.name ?? existing.name,
      body.description ?? existing.description,
      body.price != null ? Number(body.price) : existing.price,
      body.category ?? existing.category_id,
      JSON.stringify(body.images ?? JSON.parse(existing.images_json || '[]')),
      body.availability ?? existing.availability,
      body.stockQuantity != null ? Number(body.stockQuantity) : existing.stock_quantity,
      JSON.stringify(body.tags ?? JSON.parse(existing.tags_json || '[]')),
      JSON.stringify(body.specifications ?? JSON.parse(existing.specifications_json || '{}')),
      body.featured != null ? (body.featured ? 1 : 0) : existing.featured,
      body.isActive != null ? (body.isActive ? 1 : 0) : existing.is_active,
      productType,
      unitType,
      minOrder,
      body.freeDelivery != null ? (body.freeDelivery ? 1 : 0) : existing.free_delivery || 0,
      existing.id
    )
    .run();

  const product = await productWithCategory(
    c.env.DB,
    await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(existing.id).first()
  );
  return c.json({ success: true, message: 'Product updated', product });
});

products.delete('/:id', protect, adminOnly, async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM products WHERE id = ?')
    .bind(c.req.param('id'))
    .run();
  if (!result.meta.changes) return c.json({ success: false, message: 'Product not found' }, 404);
  return c.json({ success: true, message: 'Product deleted' });
});

categories.get('/', async (c) => {
  const type = c.req.query('type');
  let sql = `SELECT * FROM categories WHERE is_active = 1`;
  const binds: unknown[] = [];
  if (type) {
    sql += ' AND type = ?';
    binds.push(type);
  }
  sql += ' ORDER BY name ASC';
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({ success: true, categories: (results || []).map(mapCategory) });
});

categories.get('/all', protect, adminOnly, async (c) => {
  const type = c.req.query('type');
  let sql = `SELECT * FROM categories`;
  const binds: unknown[] = [];
  if (type) {
    sql += ' WHERE type = ?';
    binds.push(type);
  }
  sql += ' ORDER BY name ASC';
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({ success: true, categories: (results || []).map(mapCategory) });
});

categories.get('/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!row) return c.json({ success: false, message: 'Category not found' }, 404);
  return c.json({ success: true, category: mapCategory(row) });
});

categories.post('/', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const id = uid();
  const slug = slugify(body.name);
  const type = body.type === 'food' ? 'food' : 'general';
  try {
    await c.env.DB.prepare(
      `INSERT INTO categories (id, name, slug, description, image, is_active, type) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.name,
        slug,
        body.description || '',
        body.image || '',
        body.isActive === false ? 0 : 1,
        type
      )
      .run();
  } catch {
    return c.json({ success: false, message: 'Category already exists' }, 400);
  }
  const category = mapCategory(
    await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first()
  );
  return c.json({ success: true, message: 'Category created', category }, 201);
});

categories.put('/:id', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!existing) return c.json({ success: false, message: 'Category not found' }, 404);

  const name = body.name ?? existing.name;
  const type =
    body.type != null ? (body.type === 'food' ? 'food' : 'general') : existing.type || 'general';
  await c.env.DB.prepare(
    `UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, is_active = ?, type = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(
      name,
      slugify(name),
      body.description ?? existing.description,
      body.image ?? existing.image,
      body.isActive != null ? (body.isActive ? 1 : 0) : existing.is_active,
      type,
      existing.id
    )
    .run();

  return c.json({
    success: true,
    message: 'Category updated',
    category: mapCategory(
      await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(existing.id).first()
    ),
  });
});

categories.delete('/:id', protect, adminOnly, async (c) => {
  const id = c.req.param('id');
  const force = c.req.query('force') === 'true';
  const count = await c.env.DB.prepare('SELECT COUNT(*) as n FROM products WHERE category_id = ?')
    .bind(id)
    .first<{ n: number }>();

  if (count && count.n > 0 && !force) {
    return c.json(
      {
        success: false,
        message: `This category has ${count.n} product(s). Confirm to delete the category and its products.`,
        productCount: count.n,
        requiresForce: true,
      },
      400
    );
  }

  if (count && count.n > 0 && force) {
    await c.env.DB.prepare('DELETE FROM products WHERE category_id = ?').bind(id).run();
  }

  const result = await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
  if (!result.meta.changes) return c.json({ success: false, message: 'Category not found' }, 404);
  return c.json({
    success: true,
    message:
      count && count.n > 0
        ? `Category and ${count.n} product(s) deleted`
        : 'Category deleted',
  });
});

export { products, categories };
