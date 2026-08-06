import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid } from '../lib/helpers';
import { protect } from '../middleware/auth';

type Vars = { user: AuthUser };
const media = new Hono<{ Bindings: Env; Variables: Vars }>();

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

media.get('/:key{.+}', async (c) => {
  const key = c.req.param('key');
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.json({ success: false, message: 'File not found' }, 404);

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(obj.body, { headers });
});

/** Authenticated users can upload (membership docs); admins use the same endpoint */
media.post('/upload', protect, async (c) => {
  const form = await c.req.parseBody();
  const file = form.file;
  if (!file || typeof file === 'string') {
    return c.json({ success: false, message: 'No file uploaded' }, 400);
  }

  if (!ALLOWED.has(file.type)) {
    return c.json({ success: false, message: 'Only JPG, PNG, WEBP, GIF allowed' }, 400);
  }
  if (file.size > MAX_BYTES) {
    return c.json({ success: false, message: 'File too large (max 8MB)' }, 400);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const key = `uploads/${Date.now()}-${uid().slice(0, 8)}.${ext}`;

  await c.env.MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const origin = new URL(c.req.url).origin;
  const url = `${origin}/api/media/${key}`;

  return c.json({ success: true, url, key }, 201);
});

export default media;
