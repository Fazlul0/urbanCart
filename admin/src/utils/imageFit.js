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

/** Resize only — keeps full design visible (no crop). Best for designed membership cards. */
export async function resizeImageFile(file, { maxWidth = 1600, quality = 0.92 } = {}) {
  const bitmap = await createImageBitmap(file);
  let outW = bitmap.width;
  let outH = bitmap.height;
  if (outW > maxWidth) {
    outH = Math.round((outH * maxWidth) / outW);
    outW = maxWidth;
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, outW, outH);
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
    maxWidth: 512,
    label: '1:1 logo',
    mode: 'resize',
    hint: 'Preferred scale: 1:1 square logo. Best: 512×512 px (PNG with transparent background).',
  },
  free: {
    maxWidth: 1600,
    label: 'any',
    mode: 'resize',
    hint: 'Preferred scale: any. Max width ~1600 px. JPG / PNG / WebP.',
  },
};
