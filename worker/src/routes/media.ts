import { Hono } from 'hono';
import type { Env, AuthUser } from '../lib/helpers';
import { uid } from '../lib/helpers';
import { protect } from '../middleware/auth';

type Vars = { user: AuthUser };
const media = new Hono<{ Bindings: Env; Variables: Vars }>();

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

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

  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) {
    return c.json(
      { success: false, message: 'Only JPG, PNG, WEBP, GIF, MP4, WEBM allowed' },
      400
    );
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return c.json(
      {
        success: false,
        message: isVideo ? 'Video too large (max 50MB)' : 'File too large (max 12MB)',
      },
      400
    );
  }

  const fallbackExt = isVideo ? 'mp4' : 'jpg';
  const ext = file.name.split('.').pop()?.toLowerCase() || fallbackExt;
  const key = `uploads/${Date.now()}-${uid().slice(0, 8)}.${ext}`;

  await c.env.MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const origin = new URL(c.req.url).origin;
  const url = `${origin}/api/media/${key}`;

  return c.json({ success: true, url, key, type: isVideo ? 'video' : 'image' }, 201);
});

export default media;
