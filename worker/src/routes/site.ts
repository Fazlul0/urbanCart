import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { protect, adminOnly } from '../middleware/auth';

type Vars = { user: AuthUser };
const site = new Hono<{ Bindings: Env; Variables: Vars }>();

function mapSettings(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    siteName: row.site_name || 'UrbanCart',
    logoUrl: row.logo_url || '',
    tagline: row.tagline || '',
    updatedAt: row.updated_at,
  };
}

async function ensureSettings(db: D1Database) {
  let row = await db.prepare(`SELECT * FROM site_settings WHERE id = 'default'`).first();
  if (!row) {
    await db
      .prepare(
        `INSERT INTO site_settings (id, site_name, logo_url, tagline)
         VALUES ('default', 'UrbanCart', '', 'Premium men''s accessories curated for the modern gentleman.')`
      )
      .run();
    row = await db.prepare(`SELECT * FROM site_settings WHERE id = 'default'`).first();
  }
  return row;
}

site.get('/settings', async (c) => {
  const row = await ensureSettings(c.env.DB);
  return c.json({ success: true, settings: mapSettings(row) });
});

site.put('/settings', protect, adminOnly, async (c) => {
  await ensureSettings(c.env.DB);
  const body = await c.req.json<any>();
  const existing = await c.env.DB.prepare(`SELECT * FROM site_settings WHERE id = 'default'`).first<any>();

  const siteName = String(body.siteName ?? existing.site_name ?? 'UrbanCart').trim() || 'UrbanCart';
  const logoUrl = body.logoUrl != null ? String(body.logoUrl).trim() : existing.logo_url || '';
  const tagline = body.tagline != null ? String(body.tagline).trim() : existing.tagline || '';

  await c.env.DB.prepare(
    `UPDATE site_settings SET
      site_name = ?, logo_url = ?, tagline = ?, updated_at = datetime('now')
     WHERE id = 'default'`
  )
    .bind(siteName, logoUrl, tagline)
    .run();

  const row = await c.env.DB.prepare(`SELECT * FROM site_settings WHERE id = 'default'`).first();
  return c.json({ success: true, message: 'Site settings updated', settings: mapSettings(row) });
});

export default site;
