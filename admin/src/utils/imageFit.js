/**
 * Crop/resize an image file to a target aspect ratio and max edge size.
 * Center-crops so the image always fills the frame (no letterboxing).
 */
export async function fitImageFile(file, { aspect = 1, maxWidth = 1200, quality = 0.88 } = {}) {
  const bitmap = await createImageBitmap(file);
  const srcW = bitmap.width;
  const srcH = bitmap.height;

  let cropW = srcW;
  let cropH = srcW / aspect;
  if (cropH > srcH) {
    cropH = srcH;
    cropW = srcH * aspect;
  }
  const sx = (srcW - cropW) / 2;
  const sy = (srcH - cropH) / 2;

  let outW = Math.round(cropW);
  let outH = Math.round(cropH);
  if (outW > maxWidth) {
    outW = maxWidth;
    outH = Math.round(maxWidth / aspect);
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, outW, outH);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image processing failed'))),
      'image/jpeg',
      quality
    );
  });

  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}

/**
 * Trim near-transparent / near-white padding so logos fill the frame.
 * Returns { sx, sy, sw, sh } in source bitmap coordinates.
 */
function contentBounds(bitmap, { alphaMax = 16, whiteMin = 248 } = {}) {
  const w = bitmap.width;
  const h = bitmap.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);

  let top = h;
  let left = w;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const nearWhite = r >= whiteMin && g >= whiteMin && b >= whiteMin;
      const empty = a <= alphaMax || nearWhite;
      if (empty) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < left || bottom < top) {
    return { sx: 0, sy: 0, sw: w, sh: h };
  }

  const pad = Math.max(2, Math.round(Math.min(w, h) * 0.02));
  const sx = Math.max(0, left - pad);
  const sy = Math.max(0, top - pad);
  const ex = Math.min(w - 1, right + pad);
  const ey = Math.min(h - 1, bottom + pad);
  return { sx, sy, sw: ex - sx + 1, sh: ey - sy + 1 };
}

/**
 * Resize only — keeps full design visible (no crop).
 * Use format: 'png' for logos so transparent backgrounds stay transparent.
 * Set trimEmpty: true for logos to remove white/transparent margins.
 */
export async function resizeImageFile(
  file,
  {
    maxWidth = 1600,
    maxHeight = 0,
    quality = 0.92,
    format = 'jpeg',
    trimEmpty = false,
  } = {}
) {
  const bitmap = await createImageBitmap(file);
  const bounds = trimEmpty
    ? contentBounds(bitmap)
    : { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height };

  let outW = bounds.sw;
  let outH = bounds.sh;
  if (outW > maxWidth) {
    outH = Math.round((outH * maxWidth) / outW);
    outW = maxWidth;
  }
  if (maxHeight > 0 && outH > maxHeight) {
    outW = Math.round((outW * maxHeight) / outH);
    outH = maxHeight;
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d', { alpha: format === 'png' });
  if (format !== 'png') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
  } else {
    ctx.clearRect(0, 0, outW, outH);
  }
  ctx.drawImage(
    bitmap,
    bounds.sx,
    bounds.sy,
    bounds.sw,
    bounds.sh,
    0,
    0,
    outW,
    outH
  );
  bitmap.close?.();

  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const blob = await new Promise((resolve, reject) => {
    const args = format === 'png' ? [mime] : [mime, quality];
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Image processing failed'))),
      ...args
    );
  });

  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.${ext}`, { type: mime });
}

/**
 * Preferred upload scales shown in admin ImageUploader.
 * `hint` is always displayed next to every upload control.
 */
export const IMAGE_PRESETS = {
  product: {
    aspect: 1,
    maxWidth: 1200,
    label: '1:1 square',
    mode: 'crop',
    hint: 'Preferred scale: 1:1 (square). Best: 1200×1200 px.',
  },
  category: {
    aspect: 4 / 3,
    maxWidth: 1200,
    label: '4:3',
    mode: 'crop',
    hint: 'Preferred scale: 4:3. Best: 1200×900 px.',
  },
  hero: {
    aspect: 16 / 9,
    maxWidth: 1920,
    label: '16:9',
    mode: 'crop',
    hint: 'Preferred scale: 16:9 widescreen. Best: 1920×1080 px.',
  },
  card: {
    aspect: 16 / 10,
    maxWidth: 1200,
    label: '16:10',
    mode: 'crop',
    hint: 'Preferred scale: 16:10. Best: 1200×750 px.',
  },
  membership: {
    maxWidth: 1800,
    label: 'ID card 1.586:1',
    mode: 'resize',
    hint: 'Preferred scale: ID card 1.586:1 (≈ 85.6×54 mm). Best: 1012×638 px. Full artwork kept (no crop).',
  },
  membershipHome: {
    maxWidth: 1800,
    label: 'wide banner ~4:1',
    mode: 'resize',
    hint: 'Preferred scale: wide banner ~4:1. Best: 1600×400 px (home title strip). Full artwork kept (no crop).',
  },
  logo: {
    maxWidth: 640,
    maxHeight: 220,
    label: 'transparent PNG logo',
    mode: 'resize',
    format: 'png',
    hint: 'PNG with transparent background recommended. Empty margins trimmed. Max ~640×220 px so it stays compact on the store.',
  },
  free: {
    maxWidth: 1600,
    label: 'any',
    mode: 'resize',
    hint: 'Preferred scale: any. Max width ~1600 px. JPG / PNG / WebP.',
  },
};
