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

export const IMAGE_PRESETS = {
  product: { aspect: 1, maxWidth: 1200, label: '1:1 square' },
  category: { aspect: 4 / 3, maxWidth: 1200, label: '4:3' },
  hero: { aspect: 16 / 9, maxWidth: 1920, label: '16:9' },
  card: { aspect: 16 / 10, maxWidth: 1200, label: '16:10' },
  free: null,
};
