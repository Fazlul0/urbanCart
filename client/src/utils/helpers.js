export const formatBDT = (amount) =>
  `৳${Number(amount || 0).toLocaleString('en-BD')}`;

export const getThumbnail = (product) => {
  if (!product?.images?.length) return 'https://placehold.co/400x400/111111/C9A227?text=UC';
  const thumb = product.images.find((i) => i.isThumbnail);
  return thumb?.url || product.images[0]?.url;
};

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
