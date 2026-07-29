import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid, mapUser } from '../lib/helpers';
import { hashPassword, verifyPassword, signToken } from '../lib/auth';
import { protect } from '../middleware/auth';

type Vars = { user: AuthUser };
const auth = new Hono<{ Bindings: Env; Variables: Vars }>();

auth.post('/register', async (c) => {
  const body = await c.req.json<{ name: string; email: string; password: string; mobile: string }>();
  const { name, email, password, mobile } = body || {};
  if (!name || !email || !password || !mobile) {
    return c.json({ success: false, message: 'All fields are required' }, 400);
  }
  if (password.length < 6) {
    return c.json({ success: false, message: 'Password must be at least 6 characters' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first();
  if (existing) {
    return c.json({ success: false, message: 'Email already registered' }, 400);
  }

  const id = uid();
  const hashed = await hashPassword(password);
  await c.env.DB.prepare(
    `INSERT INTO users (id, name, email, password, mobile, role) VALUES (?, ?, ?, ?, ?, 'user')`
  )
    .bind(id, name.trim(), email.toLowerCase(), hashed, mobile.trim())
    .run();

  const token = await signToken(id, c.env.JWT_SECRET);
  return c.json(
    {
      success: true,
      message: 'Registration successful',
      token,
      user: { id, name, email: email.toLowerCase(), mobile, role: 'user' },
    },
    201
  );
});

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  if (!email || !password) {
    return c.json({ success: false, message: 'Email and password required' }, 400);
  }

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first<any>();
  if (!user || !(await verifyPassword(password, user.password))) {
    return c.json({ success: false, message: 'Invalid email or password' }, 401);
  }
  if (user.is_banned) {
    return c.json({ success: false, message: 'Your account has been banned' }, 403);
  }

  const token = await signToken(user.id, c.env.JWT_SECRET);
  return c.json({
    success: true,
    message: 'Login successful',
    token,
    user: mapUser(user),
  });
});

auth.post('/admin/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();

  if (email === c.env.ADMIN_EMAIL && password === c.env.ADMIN_PASSWORD) {
    let admin = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(c.env.ADMIN_EMAIL)
      .first<any>();

    if (!admin) {
      const id = uid();
      const hashed = await hashPassword(c.env.ADMIN_PASSWORD);
      await c.env.DB.prepare(
        `INSERT INTO users (id, name, email, password, mobile, role) VALUES (?, 'Admin', ?, ?, '0000000000', 'admin')`
      )
        .bind(id, c.env.ADMIN_EMAIL, hashed)
        .run();
      admin = { id, name: 'Admin', email: c.env.ADMIN_EMAIL, mobile: '0000000000', role: 'admin' };
    } else if (admin.role !== 'admin') {
      await c.env.DB.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).bind(admin.id).run();
      admin.role = 'admin';
    }

    const token = await signToken(admin.id, c.env.JWT_SECRET);
    return c.json({
      success: true,
      message: 'Admin login successful',
      token,
      user: { id: admin.id, name: admin.name, email: admin.email, role: 'admin' },
    });
  }

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE email = ? AND role = 'admin'`)
    .bind(email?.toLowerCase())
    .first<any>();
  if (!user || !(await verifyPassword(password, user.password))) {
    return c.json({ success: false, message: 'Invalid admin credentials' }, 401);
  }

  const token = await signToken(user.id, c.env.JWT_SECRET);
  return c.json({
    success: true,
    message: 'Admin login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: 'admin' },
  });
});

auth.get('/me', protect, async (c) => {
  return c.json({ success: true, user: mapUser(c.get('user')) });
});

auth.put('/profile', protect, async (c) => {
  const user = c.get('user');
  const body = await c.req.json<any>();
  const name = body.name ?? user.name;
  const mobile = body.mobile ?? user.mobile;
  let address = user.address_json ? JSON.parse(user.address_json) : {};
  if (body.address) address = { ...address, ...body.address };

  await c.env.DB.prepare(
    `UPDATE users SET name = ?, mobile = ?, address_json = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(name, mobile, JSON.stringify(address), user.id)
    .run();

  const updated = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  return c.json({ success: true, message: 'Profile updated', user: mapUser(updated) });
});

auth.put('/password', protect, async (c) => {
  const user = c.get('user');
  const { currentPassword, newPassword } = await c.req.json<{
    currentPassword: string;
    newPassword: string;
  }>();
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return c.json({ success: false, message: 'Invalid password data' }, 400);
  }

  const row = await c.env.DB.prepare('SELECT password FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ password: string }>();
  if (!row || !(await verifyPassword(currentPassword, row.password))) {
    return c.json({ success: false, message: 'Current password is incorrect' }, 400);
  }

  const hashed = await hashPassword(newPassword);
  await c.env.DB.prepare(`UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(hashed, user.id)
    .run();

  return c.json({ success: true, message: 'Password changed successfully' });
});

export default auth;
