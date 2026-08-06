import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid, mapMembershipApp, parseJson } from '../lib/helpers';
import { protect, adminOnly } from '../middleware/auth';

type Vars = { user: AuthUser };
const membership = new Hono<{ Bindings: Env; Variables: Vars }>();

function mapSettings(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || '',
    fee: row.fee,
    cardImage: row.card_image || '',
    features: parseJson<string[]>(row.features_json, []),
    isActive: !!row.is_active,
    updatedAt: row.updated_at,
  };
}

async function ensureSettings(db: D1Database) {
  let row = await db.prepare(`SELECT * FROM membership_settings WHERE id = 'default'`).first();
  if (!row) {
    await db
      .prepare(
        `INSERT INTO membership_settings (id, title, subtitle, fee, features_json, is_active)
         VALUES ('default', 'UrbanCart Gold Membership', 'Exclusive perks for loyal customers', 999,
         '["Free delivery on all orders","Member-only discounts","Priority customer support","Early access to new products"]', 1)`
      )
      .run();
    row = await db.prepare(`SELECT * FROM membership_settings WHERE id = 'default'`).first();
  }
  return row;
}

membership.get('/settings', async (c) => {
  const row = await ensureSettings(c.env.DB);
  return c.json({ success: true, settings: mapSettings(row) });
});

membership.put('/settings', protect, adminOnly, async (c) => {
  await ensureSettings(c.env.DB);
  const body = await c.req.json<any>();
  const existing = await c.env.DB.prepare(`SELECT * FROM membership_settings WHERE id = 'default'`).first<any>();

  const features = Array.isArray(body.features)
    ? body.features.map((f: string) => String(f).trim()).filter(Boolean)
    : parseJson<string[]>(existing.features_json, []);

  await c.env.DB.prepare(
    `UPDATE membership_settings SET
      title = ?, subtitle = ?, fee = ?, card_image = ?, features_json = ?,
      is_active = ?, updated_at = datetime('now')
     WHERE id = 'default'`
  )
    .bind(
      body.title ?? existing.title,
      body.subtitle ?? existing.subtitle,
      body.fee != null ? Number(body.fee) : existing.fee,
      body.cardImage ?? existing.card_image,
      JSON.stringify(features),
      body.isActive != null ? (body.isActive ? 1 : 0) : existing.is_active
    )
    .run();

  const row = await c.env.DB.prepare(`SELECT * FROM membership_settings WHERE id = 'default'`).first();
  return c.json({ success: true, message: 'Membership settings updated', settings: mapSettings(row) });
});

membership.get('/my', protect, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM membership_applications WHERE user_id = ? ORDER BY created_at DESC`
  )
    .bind(user.id)
    .all();
  return c.json({
    success: true,
    applications: (results || []).map(mapMembershipApp),
  });
});

membership.post('/apply', protect, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<any>();
  const settings = await ensureSettings(c.env.DB);

  if (!(settings as any)?.is_active) {
    return c.json({ success: false, message: 'Membership applications are closed' }, 400);
  }

  const fullName = String(body.fullName || '').trim();
  const profession = String(body.profession || '').trim();
  const mobile = String(body.mobile || '').trim();
  const photo = String(body.photo || '').trim();

  if (!fullName || !profession || !mobile || !photo) {
    return c.json(
      { success: false, message: 'Name, profession, mobile, and photo are required' },
      400
    );
  }

  const pending = await c.env.DB.prepare(
    `SELECT id FROM membership_applications WHERE user_id = ? AND status = 'pending' LIMIT 1`
  )
    .bind(user.id)
    .first();
  if (pending) {
    return c.json({ success: false, message: 'You already have a pending application' }, 400);
  }

  const approved = await c.env.DB.prepare(
    `SELECT id FROM membership_applications WHERE user_id = ? AND status = 'approved' LIMIT 1`
  )
    .bind(user.id)
    .first();
  if (approved) {
    return c.json({ success: false, message: 'You already have an approved membership' }, 400);
  }

  const id = uid();
  await c.env.DB.prepare(
    `INSERT INTO membership_applications
     (id, user_id, full_name, profession, mobile, address, nid_number, nid_image, photo, status, fee)
     VALUES (?, ?, ?, ?, ?, '', '', '', ?, 'pending', ?)`
  )
    .bind(id, user.id, fullName, profession, mobile, photo, (settings as any).fee || 0)
    .run();

  const app = mapMembershipApp(
    await c.env.DB.prepare('SELECT * FROM membership_applications WHERE id = ?').bind(id).first()
  );
  return c.json({ success: true, message: 'Application submitted', application: app }, 201);
});

membership.get('/applications', protect, adminOnly, async (c) => {
  const status = c.req.query('status');
  let sql = `SELECT * FROM membership_applications`;
  const binds: unknown[] = [];
  if (status) {
    sql += ' WHERE status = ?';
    binds.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({
    success: true,
    applications: (results || []).map(mapMembershipApp),
  });
});

membership.get('/applications/:id', protect, adminOnly, async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM membership_applications WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!row) return c.json({ success: false, message: 'Application not found' }, 404);
  return c.json({ success: true, application: mapMembershipApp(row) });
});

membership.put('/applications/:id', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const existing = await c.env.DB.prepare('SELECT * FROM membership_applications WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!existing) return c.json({ success: false, message: 'Application not found' }, 404);

  const status = ['pending', 'approved', 'rejected'].includes(body.status)
    ? body.status
    : existing.status;

  await c.env.DB.prepare(
    `UPDATE membership_applications SET status = ?, admin_note = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(status, body.adminNote ?? existing.admin_note ?? '', existing.id)
    .run();

  return c.json({
    success: true,
    message: 'Application updated',
    application: mapMembershipApp(
      await c.env.DB.prepare('SELECT * FROM membership_applications WHERE id = ?')
        .bind(existing.id)
        .first()
    ),
  });
});

export default membership;
