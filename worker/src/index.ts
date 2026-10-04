import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './lib/helpers';
import { seedDatabase } from './lib/seed';
import auth from './routes/auth';
import { products, categories } from './routes/catalog';
import cart from './routes/cart';
import orders from './routes/orders';
import reviews from './routes/reviews';
import admin from './routes/admin';
import media from './routes/media';
import hero from './routes/hero';
import membership from './routes/membership';
import site from './routes/site';
import wishlist from './routes/wishlist';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const allowed = new Set([
    c.env.CLIENT_URL,
    c.env.ADMIN_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'https://nogorcar.store',
    'https://www.nogorcar.store',
    'https://admin.nogorcar.store',
    // Transitional Pages hosts (until custom domains fully cut over)
    'https://urbancart-7he.pages.dev',
    'https://urbancart-admin.pages.dev',
  ]);
  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowed.has(origin)) return origin;
      if (
        origin.endsWith('.nogorcar.store') ||
        origin.endsWith('.urbancart-7he.pages.dev') ||
        origin.endsWith('.urbancart-admin.pages.dev')
      ) {
        return origin;
      }
      return null;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

app.get('/api/health', (c) =>
  c.json({
    success: true,
    message: 'Nogor Car API is running on Cloudflare Workers',
    brand: 'Nogor Car',
  })
);

/** Local/dev seed — enabled when ALLOW_SEED=true in .dev.vars */
app.post('/api/dev/seed', async (c) => {
  if (c.env.ALLOW_SEED !== 'true') {
    return c.json({ success: false, message: 'Seeding disabled' }, 403);
  }
  const result = await seedDatabase(c.env);
  return c.json({ success: true, message: 'Seed completed', ...result });
});

app.route('/api/auth', auth);
app.route('/api/products', products);
app.route('/api/categories', categories);
app.route('/api/cart', cart);
app.route('/api/orders', orders);
app.route('/api/reviews', reviews);
app.route('/api/admin', admin);
app.route('/api/media', media);
app.route('/api/hero', hero);
app.route('/api/membership', membership);
app.route('/api/site', site);
app.route('/api/wishlist', wishlist);

app.notFound((c) => c.json({ success: false, message: 'Route not found' }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ success: false, message: err.message || 'Internal server error' }, 500);
});

export default app;
