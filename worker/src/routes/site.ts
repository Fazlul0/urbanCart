import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { protect, adminOnly } from '../middleware/auth';

type Vars = { user: AuthUser };
const site = new Hono<{ Bindings: Env; Variables: Vars }>();

const DEFAULT_FOOTER_LINKS = [
  { label: 'ফিটনেস এ্যাপয়েন্টমেন্টের সময়সূচি', url: '/contact' },
  { label: 'রেজিস্ট্রেশন ফি ও নবায়ন', url: '/contact' },
  { label: 'ট্যাক্স টোকেন ও রুট পারমিট ফি', url: '/contact' },
  { label: 'সার্ভিস চার্জ ও ডেলিভারি ফি', url: '/contact' },
  { label: 'নিবন্ধিত মোটরযানের ফি', url: '/contact' },
];

function parseFooterLinks(raw: unknown) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw || '[]') : raw;
    if (!Array.isArray(parsed)) return [...DEFAULT_FOOTER_LINKS];
    return parsed
      .map((item: any) => ({
        label: String(item?.label || '').trim(),
        url: String(item?.url || '').trim(),
      }))
      .filter((item) => item.label && item.url)
      .slice(0, 20);
  } catch {
    return [...DEFAULT_FOOTER_LINKS];
  }
}

function mapSettings(row: any) {
  if (!row) return null;
  const footerLinks = parseFooterLinks(row.footer_links_json);
  return {
    id: row.id,
    siteName: row.site_name || 'Nogor Car',
    logoUrl: row.logo_url || '',
    tagline: row.tagline || '',
    footerLinks: footerLinks.length ? footerLinks : [...DEFAULT_FOOTER_LINKS],
    deliveryCharge:
      row.delivery_charge != null ? Number(row.delivery_charge) : Number(120),
    updatedAt: row.updated_at,
  };
}

async function ensureSettings(db: D1Database) {
  let row = await db.prepare(`SELECT * FROM site_settings WHERE id = 'default'`).first();
  if (!row) {
    await db
      .prepare(
        `INSERT INTO site_settings (id, site_name, logo_url, tagline, footer_links_json, delivery_charge)
         VALUES ('default', 'Nogor Car', '', 'Car accessories for every ride.', ?, 120)`
      )
      .bind(JSON.stringify(DEFAULT_FOOTER_LINKS))
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

  const siteName = String(body.siteName ?? existing.site_name ?? 'Nogor Car').trim() || 'Nogor Car';
  const logoUrl = body.logoUrl != null ? String(body.logoUrl).trim() : existing.logo_url || '';
  const tagline = body.tagline != null ? String(body.tagline).trim() : existing.tagline || '';
  const footerLinks =
    body.footerLinks != null
      ? parseFooterLinks(body.footerLinks)
      : parseFooterLinks(existing.footer_links_json);
  const deliveryCharge =
    body.deliveryCharge != null
      ? Math.max(0, Number(body.deliveryCharge) || 0)
      : existing.delivery_charge != null
        ? Number(existing.delivery_charge)
        : 120;

  await c.env.DB.prepare(
    `UPDATE site_settings SET
      site_name = ?, logo_url = ?, tagline = ?, footer_links_json = ?, delivery_charge = ?,
      updated_at = datetime('now')
     WHERE id = 'default'`
  )
    .bind(siteName, logoUrl, tagline, JSON.stringify(footerLinks), deliveryCharge)
    .run();

  const row = await c.env.DB.prepare(`SELECT * FROM site_settings WHERE id = 'default'`).first();
  return c.json({ success: true, message: 'Site settings updated', settings: mapSettings(row) });
});

export default site;
