import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid, mapProduct, mapCategory, uniqueCategorySlug } from '../lib/helpers';
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
  } else if (q.scope === 'home') {
    where.push('(c.hide_from_home IS NULL OR c.hide_from_home = 0)');
  } else {
    where.push('(c.hide_from_catalog IS NULL OR c.hide_from_catalog = 0)');
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

  let orderBy = 'p.sort_order ASC, p.created_at DESC';
  switch (q.sort) {
    case 'price_asc':
      orderBy = 'p.price ASC, p.sort_order ASC';
      break;
    case 'price_desc':
      orderBy = 'p.price DESC, p.sort_order ASC';
      break;
    case 'rating':
      orderBy = 'p.rating DESC, p.sort_order ASC';
      break;
    case 'bestselling':
      orderBy = 'p.sold_count DESC, p.sort_order ASC';
      break;
    case 'newest':
      orderBy = 'p.created_at DESC';
      break;
    case 'manual':
    default:
      orderBy = 'p.sort_order ASC, p.created_at DESC';
      break;
  }

  const whereSql = where.join(' AND ');
  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${whereSql}`
  )
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

  const limitRaw = Number(c.req.query('limit') || 24);
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 24, 1), 50);

  const { results } = await c.env.DB.prepare(
    `SELECT p.*, c.id as c_id, c.name as c_name, c.slug as c_slug, c.type as c_type
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
     ORDER BY p.sort_order ASC, p.created_at DESC
     LIMIT ?`
  )
    .bind(product.category_id, product.id, limit)
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
  // New products always land at sort_order = 1; bump peers of the same type
  const sortOrder = 1;

  const productCode =
    String(body.productCode || '')
      .trim()
      .toUpperCase() || `SM-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const productSourcing = String(body.productSourcing || '').trim();
  const compareAtPrice =
    body.compareAtPrice != null && body.compareAtPrice !== ''
      ? Number(body.compareAtPrice)
      : null;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE products SET sort_order = sort_order + 1 WHERE product_type = ?`
    ).bind(productType),
    c.env.DB.prepare(
      `INSERT INTO products
     (id, name, description, price, compare_at_price, category_id, images_json, availability, stock_quantity,
      tags_json, specifications_json, featured, is_active, product_type, unit_type, min_order, free_delivery, sort_order, product_code, product_sourcing)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.name,
      body.description,
      Number(body.price),
      compareAtPrice != null && !Number.isNaN(compareAtPrice) ? compareAtPrice : null,
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
      body.freeDelivery ? 1 : 0,
      sortOrder,
      productCode,
      productSourcing
    ),
  ]);

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
  const sortOrder =
    body.sortOrder != null && body.sortOrder !== ''
      ? Number(body.sortOrder)
      : Number(existing.sort_order ?? 0);

  const productCode =
    body.productCode != null
      ? String(body.productCode).trim().toUpperCase() || existing.product_code || ''
      : existing.product_code || '';
  const productSourcing =
    body.productSourcing != null
      ? String(body.productSourcing).trim()
      : existing.product_sourcing || '';
  let compareAtPrice = existing.compare_at_price ?? null;
  if (body.compareAtPrice !== undefined) {
    if (body.compareAtPrice === null || body.compareAtPrice === '') {
      compareAtPrice = null;
    } else {
      const n = Number(body.compareAtPrice);
      compareAtPrice = Number.isNaN(n) ? null : n;
    }
  }

  await c.env.DB.prepare(
    `UPDATE products SET
      name = ?, description = ?, price = ?, compare_at_price = ?, category_id = ?, images_json = ?,
      availability = ?, stock_quantity = ?, tags_json = ?, specifications_json = ?,
      featured = ?, is_active = ?, product_type = ?, unit_type = ?, min_order = ?,
      free_delivery = ?, sort_order = ?, product_code = ?, product_sourcing = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      body.name ?? existing.name,
      body.description ?? existing.description,
      body.price != null ? Number(body.price) : existing.price,
      compareAtPrice,
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
      sortOrder,
      productCode,
      productSourcing,
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
  sql += ' ORDER BY sort_order ASC, name ASC';
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
  sql += ' ORDER BY sort_order ASC, name ASC';
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
  const slug = await uniqueCategorySlug(c.env.DB, body.name || '', id);
  const type = body.type === 'food' ? 'food' : 'general';
  const max = await c.env.DB.prepare(
    `SELECT COALESCE(MAX(sort_order), 0) as m FROM categories WHERE type = ?`
  )
    .bind(type)
    .first<{ m: number }>();
  const sortOrder =
    body.sortOrder != null && body.sortOrder !== ''
      ? Number(body.sortOrder)
      : (max?.m ?? 0) + 1;
  const hideFromHome = body.hideFromHome ? 1 : 0;
  const hideFromCatalog = body.hideFromProductList ? 1 : 0;
  try {
    await c.env.DB.prepare(
      `INSERT INTO categories (id, name, slug, description, image, icon, is_active, type, sort_order, hide_from_home, hide_from_catalog) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.name,
        slug,
        body.description || '',
        body.image || '',
        body.icon || '',
        body.isActive === false ? 0 : 1,
        type,
        sortOrder,
        hideFromHome,
        hideFromCatalog
      )
      .run();
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (msg.includes('UNIQUE') && msg.includes('name')) {
      return c.json({ success: false, message: 'A category with this name already exists' }, 400);
    }
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

  const name = body.name != null ? String(body.name).trim() : existing.name;
  const nameChanged = body.name != null && name !== existing.name;
  const slug = nameChanged
    ? await uniqueCategorySlug(c.env.DB, name, existing.id, existing.slug)
    : existing.slug;
  const type =
    body.type != null ? (body.type === 'food' ? 'food' : 'general') : existing.type || 'general';
  const sortOrder =
    body.sortOrder != null && body.sortOrder !== ''
      ? Number(body.sortOrder)
      : Number(existing.sort_order ?? 0);
  const hideFromHome =
    body.hideFromHome != null
      ? body.hideFromHome
        ? 1
        : 0
      : existing.hide_from_home
        ? 1
        : 0;
  const hideFromCatalog =
    body.hideFromProductList != null
      ? body.hideFromProductList
        ? 1
        : 0
      : existing.hide_from_catalog
        ? 1
        : 0;

  try {
    await c.env.DB.prepare(
      `UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, icon = ?, is_active = ?, type = ?, sort_order = ?, hide_from_home = ?, hide_from_catalog = ?, updated_at = datetime('now') WHERE id = ?`
    )
      .bind(
        name,
        slug,
        body.description != null ? body.description : existing.description,
        body.image != null ? body.image : existing.image,
        body.icon != null ? body.icon : existing.icon || '',
        body.isActive != null ? (body.isActive ? 1 : 0) : existing.is_active,
        type,
        sortOrder,
        hideFromHome,
        hideFromCatalog,
        existing.id
      )
      .run();
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (msg.includes('UNIQUE') && msg.includes('name')) {
      return c.json({ success: false, message: 'A category with this name already exists' }, 400);
    }
    if (msg.includes('UNIQUE') && msg.includes('slug')) {
      return c.json({ success: false, message: 'Could not update category slug — try a different name' }, 400);
    }
    return c.json({ success: false, message: 'Update failed' }, 400);
  }

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
