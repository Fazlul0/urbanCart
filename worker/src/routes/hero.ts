import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid } from '../lib/helpers';
import { protect, adminOnly } from '../middleware/auth';

type Vars = { user: AuthUser };
const hero = new Hono<{ Bindings: Env; Variables: Vars }>();

const mapHero = (row: any) =>
  row
    ? {
        _id: row.id,
        id: row.id,
        url: row.url,
        alt: row.alt || '',
        position: row.position || 'center center',
        sortOrder: row.sort_order,
        isActive: !!row.is_active,
        createdAt: row.created_at,
      }
    : null;

/** Public — active hero slides for storefront */
hero.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM hero_images WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC`
  ).all();
  return c.json({ success: true, images: (results || []).map(mapHero) });
});

/** Admin — all slides */
hero.get('/all', protect, adminOnly, async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM hero_images ORDER BY sort_order ASC, created_at ASC`
  ).all();
  return c.json({ success: true, images: (results || []).map(mapHero) });
});

hero.post('/', protect, adminOnly, async (c) => {
  const body = await c.req.json<{ url: string; alt?: string; position?: string; sortOrder?: number }>();
  if (!body.url) return c.json({ success: false, message: 'Image URL is required' }, 400);

  const max = await c.env.DB.prepare(`SELECT COALESCE(MAX(sort_order), -1) as m FROM hero_images`).first<{
    m: number;
  }>();
  const id = uid();
  const sortOrder = body.sortOrder ?? (max?.m ?? -1) + 1;

  await c.env.DB.prepare(
    `INSERT INTO hero_images (id, url, alt, position, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)`
  )
    .bind(id, body.url, body.alt || '', body.position || 'center center', sortOrder)
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM hero_images WHERE id = ?').bind(id).first();
  return c.json({ success: true, message: 'Hero image added', image: mapHero(row) }, 201);
});

hero.put('/:id', protect, adminOnly, async (c) => {
  const existing = await c.env.DB.prepare('SELECT * FROM hero_images WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!existing) return c.json({ success: false, message: 'Not found' }, 404);

  const body = await c.req.json<any>();
  await c.env.DB.prepare(
    `UPDATE hero_images SET url = ?, alt = ?, position = ?, sort_order = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(
      body.url ?? existing.url,
      body.alt ?? existing.alt,
      body.position ?? existing.position,
      body.sortOrder != null ? Number(body.sortOrder) : existing.sort_order,
      body.isActive != null ? (body.isActive ? 1 : 0) : existing.is_active,
      existing.id
    )
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM hero_images WHERE id = ?').bind(existing.id).first();
  return c.json({ success: true, message: 'Updated', image: mapHero(row) });
});

hero.delete('/:id', protect, adminOnly, async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM hero_images WHERE id = ?')
    .bind(c.req.param('id'))
    .run();
  if (!result.meta.changes) return c.json({ success: false, message: 'Not found' }, 404);
  return c.json({ success: true, message: 'Hero image deleted' });
});

export default hero;
