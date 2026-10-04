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
    homeImage: row.home_image || row.card_image || '',
    cardFront: row.card_front || row.card_image || '',
    cardBack: row.card_back || '',
    features: parseJson<string[]>(row.features_json, []),
    productCode: row.product_code || '',
    lostCardFee: row.lost_card_fee != null ? Number(row.lost_card_fee) : 200,
    isActive: !!row.is_active,
    updatedAt: row.updated_at,
  };
}

async function ensureSettings(db: D1Database) {
  let row = await db.prepare(`SELECT * FROM membership_settings WHERE id = 'default'`).first();
  if (!row) {
    // Bangla benefit strings: emoji + **title** + body — compatible with client BenefitCard parser
    const defaultFeatures = JSON.stringify([
      '🚚 **ফ্রি ডেলিভারি**\nসব অর্ডারে বিনামূল্যে ডেলিভারি সুবিধা',
      '🏷️ **সদস্য ছাড়**\nমেম্বারদের জন্য বিশেষ ডিসকাউন্ট ও অফার',
      '🎧 **অগ্রাধিকার সাপোর্ট**\nপ্রাধান্যভিত্তিক কাস্টমার সাপোর্ট',
      '✨ **নতুন পণ্যে আগে সুযোগ**\nনতুন পণ্যে আগেই অ্যাক্সেস',
    ]);
    await db
      .prepare(
        `INSERT INTO membership_settings (id, title, subtitle, fee, features_json, is_active)
         VALUES ('default', 'Nogor Car Gold Membership', 'Exclusive perks for loyal customers', 999,
         ?, 1)`
      )
      .bind(defaultFeatures)
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
      title = ?, subtitle = ?, fee = ?, card_image = ?, home_image = ?,
      card_front = ?, card_back = ?, features_json = ?, product_code = ?,
      lost_card_fee = ?, is_active = ?, updated_at = datetime('now')
     WHERE id = 'default'`
  )
    .bind(
      body.title ?? existing.title,
      body.subtitle ?? existing.subtitle,
      body.fee != null ? Number(body.fee) : existing.fee,
      body.cardImage ?? body.homeImage ?? existing.card_image,
      body.homeImage != null ? String(body.homeImage).trim() : existing.home_image || '',
      body.cardFront != null ? String(body.cardFront).trim() : existing.card_front || '',
      body.cardBack != null ? String(body.cardBack).trim() : existing.card_back || '',
      JSON.stringify(features),
      body.productCode != null
        ? String(body.productCode).trim().toUpperCase()
        : existing.product_code || '',
      body.lostCardFee != null
        ? Math.max(0, Number(body.lostCardFee) || 0)
        : existing.lost_card_fee != null
          ? Number(existing.lost_card_fee)
          : 200,
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

function mapFacility(row: any) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    image: row.image || '',
    description: row.description || '',
    sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
    isActive: !!row.is_active,
  };
}

function mapShop(row: any) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    facilityId: row.facility_id,
    name: row.name,
    image: row.image || '',
    ownerName: row.owner_name || '',
    ownerMobile: row.owner_mobile || '',
    secondaryMobile: row.secondary_mobile || '',
    location: row.location || '',
    locationLink: row.location_link || '',
    sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
    isActive: !!row.is_active,
  };
}

membership.get('/facilities', async (c) => {
  const admin = c.req.query('all') === '1';
  let sql = `SELECT * FROM membership_facilities`;
  if (!admin) sql += ' WHERE is_active = 1';
  sql += ' ORDER BY sort_order ASC, name ASC';
  const { results } = await c.env.DB.prepare(sql).all();
  return c.json({ success: true, facilities: (results || []).map(mapFacility) });
});

membership.get('/facilities/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM membership_facilities WHERE id = ?')
    .bind(c.req.param('id'))
    .first();
  if (!row) return c.json({ success: false, message: 'Facility not found' }, 404);
  return c.json({ success: true, facility: mapFacility(row) });
});

membership.post('/facilities', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const name = String(body.name || '').trim();
  if (!name) return c.json({ success: false, message: 'Name is required' }, 400);
  const id = uid();
  const slug =
    String(body.slug || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || id.slice(0, 8);
  const max = await c.env.DB.prepare(
    `SELECT COALESCE(MAX(sort_order), 0) as m FROM membership_facilities`
  ).first<{ m: number }>();
  await c.env.DB.prepare(
    `INSERT INTO membership_facilities (id, name, slug, image, description, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      name,
      slug,
      String(body.image || '').trim(),
      String(body.description || '').trim(),
      body.sortOrder != null ? Number(body.sortOrder) : (max?.m ?? 0) + 1,
      body.isActive === false ? 0 : 1
    )
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM membership_facilities WHERE id = ?')
    .bind(id)
    .first();
  return c.json({ success: true, facility: mapFacility(row) }, 201);
});

membership.put('/facilities/:id', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const existing = await c.env.DB.prepare('SELECT * FROM membership_facilities WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!existing) return c.json({ success: false, message: 'Facility not found' }, 404);
  await c.env.DB.prepare(
    `UPDATE membership_facilities SET
      name = ?, slug = ?, image = ?, description = ?, sort_order = ?, is_active = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      body.name != null ? String(body.name).trim() : existing.name,
      body.slug != null
        ? String(body.slug)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || existing.slug
        : existing.slug,
      body.image != null ? String(body.image).trim() : existing.image || '',
      body.description != null ? String(body.description).trim() : existing.description || '',
      body.sortOrder != null ? Number(body.sortOrder) : existing.sort_order,
      body.isActive != null ? (body.isActive ? 1 : 0) : existing.is_active,
      existing.id
    )
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM membership_facilities WHERE id = ?')
    .bind(existing.id)
    .first();
  return c.json({ success: true, facility: mapFacility(row) });
});

membership.delete('/facilities/:id', protect, adminOnly, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM membership_shops WHERE facility_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM membership_facilities WHERE id = ?').bind(id).run();
  return c.json({ success: true, message: 'Facility deleted' });
});

membership.get('/facilities/:id/shops', async (c) => {
  const facilityId = c.req.param('id');
  const admin = c.req.query('all') === '1';
  let sql = `SELECT * FROM membership_shops WHERE facility_id = ?`;
  if (!admin) sql += ' AND is_active = 1';
  sql += ' ORDER BY sort_order ASC, name ASC';
  const { results } = await c.env.DB.prepare(sql).bind(facilityId).all();
  return c.json({ success: true, shops: (results || []).map(mapShop) });
});

membership.post('/shops', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const facilityId = String(body.facilityId || '').trim();
  const name = String(body.name || '').trim();
  if (!facilityId || !name) {
    return c.json({ success: false, message: 'Facility and shop name are required' }, 400);
  }
  const fac = await c.env.DB.prepare('SELECT id FROM membership_facilities WHERE id = ?')
    .bind(facilityId)
    .first();
  if (!fac) return c.json({ success: false, message: 'Facility not found' }, 404);
  const id = uid();
  const max = await c.env.DB.prepare(
    `SELECT COALESCE(MAX(sort_order), 0) as m FROM membership_shops WHERE facility_id = ?`
  )
    .bind(facilityId)
    .first<{ m: number }>();
  await c.env.DB.prepare(
    `INSERT INTO membership_shops
     (id, facility_id, name, image, owner_name, owner_mobile, secondary_mobile, location, location_link, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      facilityId,
      name,
      String(body.image || '').trim(),
      String(body.ownerName || '').trim(),
      String(body.ownerMobile || '').trim(),
      String(body.secondaryMobile || '').trim(),
      String(body.location || '').trim(),
      String(body.locationLink || '').trim(),
      body.sortOrder != null ? Number(body.sortOrder) : (max?.m ?? 0) + 1,
      body.isActive === false ? 0 : 1
    )
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM membership_shops WHERE id = ?').bind(id).first();
  return c.json({ success: true, shop: mapShop(row) }, 201);
});

membership.put('/shops/:id', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const existing = await c.env.DB.prepare('SELECT * FROM membership_shops WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!existing) return c.json({ success: false, message: 'Shop not found' }, 404);
  await c.env.DB.prepare(
    `UPDATE membership_shops SET
      name = ?, image = ?, owner_name = ?, owner_mobile = ?, secondary_mobile = ?,
      location = ?, location_link = ?, sort_order = ?, is_active = ?, updated_at = datetime('now')
     WHERE id = ?`
  )
    .bind(
      body.name != null ? String(body.name).trim() : existing.name,
      body.image != null ? String(body.image).trim() : existing.image || '',
      body.ownerName != null ? String(body.ownerName).trim() : existing.owner_name || '',
      body.ownerMobile != null ? String(body.ownerMobile).trim() : existing.owner_mobile || '',
      body.secondaryMobile != null
        ? String(body.secondaryMobile).trim()
        : existing.secondary_mobile || '',
      body.location != null ? String(body.location).trim() : existing.location || '',
      body.locationLink != null ? String(body.locationLink).trim() : existing.location_link || '',
      body.sortOrder != null ? Number(body.sortOrder) : existing.sort_order,
      body.isActive != null ? (body.isActive ? 1 : 0) : existing.is_active,
      existing.id
    )
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM membership_shops WHERE id = ?')
    .bind(existing.id)
    .first();
  return c.json({ success: true, shop: mapShop(row) });
});

membership.delete('/shops/:id', protect, adminOnly, async (c) => {
  await c.env.DB.prepare('DELETE FROM membership_shops WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true, message: 'Shop deleted' });
});

membership.get('/lost-card/my', protect, async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM lost_card_applications WHERE user_id = ? ORDER BY created_at DESC`
  )
    .bind(user.id)
    .all();
  return c.json({
    success: true,
    applications: (results || []).map((r: any) => ({
      _id: r.id,
      status: r.status,
      note: r.note || '',
      adminNote: r.admin_note || '',
      createdAt: r.created_at,
    })),
  });
});

membership.post('/lost-card/apply', protect, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<any>().catch(() => ({}));

  const approved = await c.env.DB.prepare(
    `SELECT id FROM membership_applications WHERE user_id = ? AND status = 'approved' LIMIT 1`
  )
    .bind(user.id)
    .first();
  if (!approved) {
    return c.json({ success: false, message: 'Only approved members can apply for a lost card' }, 400);
  }

  const pending = await c.env.DB.prepare(
    `SELECT id FROM lost_card_applications WHERE user_id = ? AND status = 'pending' LIMIT 1`
  )
    .bind(user.id)
    .first();
  if (pending) {
    return c.json({ success: false, message: 'You already have a pending lost-card request' }, 400);
  }

  const id = uid();
  await c.env.DB.prepare(
    `INSERT INTO lost_card_applications (id, user_id, full_name, mobile, note, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`
  )
    .bind(
      id,
      user.id,
      String(body.fullName || user.name || '').trim(),
      String(body.mobile || user.mobile || '').trim(),
      String(body.note || '').trim()
    )
    .run();

  return c.json({ success: true, message: 'Lost card application submitted' }, 201);
});

membership.get('/lost-card/applications', protect, adminOnly, async (c) => {
  const status = c.req.query('status');
  let sql = `SELECT l.*, u.name as u_name, u.email as u_email
             FROM lost_card_applications l
             LEFT JOIN users u ON u.id = l.user_id`;
  const binds: unknown[] = [];
  if (status) {
    sql += ' WHERE l.status = ?';
    binds.push(status);
  }
  sql += ' ORDER BY l.created_at DESC';
  const { results } = await c.env.DB.prepare(sql).bind(...binds).all();
  return c.json({
    success: true,
    applications: (results || []).map((r: any) => ({
      _id: r.id,
      fullName: r.full_name || r.u_name,
      mobile: r.mobile,
      note: r.note || '',
      status: r.status,
      adminNote: r.admin_note || '',
      userEmail: r.u_email || '',
      createdAt: r.created_at,
    })),
  });
});

membership.put('/lost-card/applications/:id', protect, adminOnly, async (c) => {
  const body = await c.req.json<any>();
  const existing = await c.env.DB.prepare('SELECT * FROM lost_card_applications WHERE id = ?')
    .bind(c.req.param('id'))
    .first<any>();
  if (!existing) return c.json({ success: false, message: 'Not found' }, 404);
  const status = ['pending', 'approved', 'rejected'].includes(body.status)
    ? body.status
    : existing.status;
  await c.env.DB.prepare(
    `UPDATE lost_card_applications SET status = ?, admin_note = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(status, body.adminNote ?? existing.admin_note ?? '', existing.id)
    .run();
  return c.json({ success: true, message: 'Updated' });
});

export default membership;
