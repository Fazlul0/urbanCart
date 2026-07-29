import { createMiddleware } from 'hono/factory';
import type { Env, AuthUser } from '../lib/helpers';
import { verifyToken } from '../lib/auth';

type Variables = {
  user: AuthUser;
};

export const protect = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return c.json({ success: false, message: 'Not authorized. Please login.' }, 401);
    }
    try {
      const decoded = await verifyToken(header.slice(7), c.env.JWT_SECRET);
      const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(decoded.id)
        .first<AuthUser>();
      if (!user) {
        return c.json({ success: false, message: 'User no longer exists.' }, 401);
      }
      if (user.is_banned) {
        return c.json({ success: false, message: 'Your account has been banned.' }, 403);
      }
      c.set('user', user);
      await next();
    } catch {
      return c.json({ success: false, message: 'Invalid or expired token.' }, 401);
    }
  }
);

export const adminOnly = createMiddleware<{ Bindings: Env; Variables: Variables }>(
  async (c, next) => {
    const user = c.get('user');
    if (user?.role !== 'admin') {
      return c.json({ success: false, message: 'Admin access required.' }, 403);
    }
    await next();
  }
);
