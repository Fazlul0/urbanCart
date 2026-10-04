export const formatBDT = (amount) =>
  `৳${Number(amount || 0).toLocaleString('en-BD')}`;

export const isVideoMedia = (media) => {
  if (!media) return false;
  if (typeof media === 'string') return /\.(mp4|webm)(\?|$)/i.test(media);
  if (media.type === 'video') return true;
  return /\.(mp4|webm)(\?|$)/i.test(media.url || '');
};

/** Prefer an image thumb; fall back to first media (may be video). */
export const getThumbnailMedia = (product) => {
  const placeholder = {
    url: 'https://placehold.co/400x400/111111/C9A227?text=UC',
    type: 'image',
  };
  if (!product?.images?.length) return placeholder;

  const images = product.images.filter((i) => !isVideoMedia(i));
  const thumbImg = images.find((i) => i.isThumbnail) || images[0];
  if (thumbImg?.url) return { url: thumbImg.url, type: 'image' };

  const any = product.images.find((i) => i.isThumbnail) || product.images[0];
  return {
    url: any?.url || placeholder.url,
    type: isVideoMedia(any) ? 'video' : 'image',
  };
};

export const getThumbnail = (product) => getThumbnailMedia(product).url;

export const AVAILABILITY_LABELS = {
  in_stock: 'In Stock',
  out_of_stock: 'Out of Stock',
  preorder: 'Pre-order',
};

export const ORDER_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const debounce = (fn, delay = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
