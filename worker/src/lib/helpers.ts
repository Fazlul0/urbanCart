export type Env = {
  DB: D1Database;
  MEDIA: R2Bucket;
  JWT_SECRET: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  CLIENT_URL: string;
  ADMIN_URL: string;
  DELIVERY_CHARGE: string;
  ALLOW_SEED?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'user' | 'admin';
  is_banned: number;
  address_json: string | null;
  referred_by?: string | null;
  profession?: string | null;
};

export const uid = () => crypto.randomUUID();

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/** Unique category slug; keeps preferExisting when latin slug would be empty (e.g. Bengali names) */
export async function uniqueCategorySlug(
  db: D1Database,
  name: string,
  excludeId?: string,
  preferExisting?: string
) {
  let base = slugify(name);
  if (!base) {
    if (preferExisting && String(preferExisting).trim()) return preferExisting;
    base = `cat-${(excludeId || uid()).replace(/-/g, '').slice(0, 8)}`;
  }
  let slug = base;
  let n = 0;
  for (;;) {
    const row = await db
      .prepare('SELECT id FROM categories WHERE slug = ?')
      .bind(slug)
      .first<{ id: string }>();
    if (!row || (excludeId && row.id === excludeId)) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export const deliveryCharge = (env: Env) => Number(env.DELIVERY_CHARGE || 120);

/** Prefer admin-configured site_settings.delivery_charge, else env */
export async function resolveDeliveryCharge(db: D1Database, env: Env) {
  try {
    const row = await db
      .prepare(`SELECT delivery_charge FROM site_settings WHERE id = 'default'`)
      .first<{ delivery_charge: number }>();
    if (row && row.delivery_charge != null && !Number.isNaN(Number(row.delivery_charge))) {
      return Number(row.delivery_charge);
    }
  } catch {
    /* column may not exist yet */
  }
  return deliveryCharge(env);
}

export const normalizeMobile = (value: string) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 13) {
    digits = `0${digits.slice(3)}`;
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    digits = `0${digits}`;
  }
  return digits;
};

/** Compare BD mobiles loosely (last 10–11 digits) */
export const mobilesMatch = (a: string, b: string) => {
  const x = normalizeMobile(a);
  const y = normalizeMobile(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const ax = x.slice(-10);
  const ay = y.slice(-10);
  return ax.length >= 10 && ax === ay;
};

export const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const mapProduct = (row: any, category?: any, opts?: { admin?: boolean }) => {
  if (!row) return null;
  const product: Record<string, unknown> = {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    compareAtPrice:
      row.compare_at_price != null && row.compare_at_price !== ''
        ? Number(row.compare_at_price)
        : null,
    category: category
      ? {
          _id: category.id,
          id: category.id,
          name: category.name,
          slug: category.slug,
          type: category.type || row.c_type || 'general',
        }
      : row.category_id,
    images: parseJson(row.images_json, []),
    availability: row.availability,
    stockQuantity: row.stock_quantity,
    tags: parseJson(row.tags_json, []),
    specifications: parseJson(row.specifications_json, {}),
    rating: row.rating,
    totalReviews: row.total_reviews,
    featured: !!row.featured,
    soldCount: row.sold_count,
    isActive: !!row.is_active,
    productType: row.product_type || 'general',
    unitType: row.unit_type || 'piece',
    minOrder: row.min_order != null ? Number(row.min_order) : 1,
    freeDelivery: !!row.free_delivery,
    sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
    productCode: row.product_code || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (opts?.admin) {
    product.productSourcing = row.product_sourcing || '';
  }
  return product;
};

export const mapUser = (row: any, includeSensitive = false) => {
  if (!row) return null;
  const user: Record<string, unknown> = {
    id: row.id,
    _id: row.id,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    role: row.role,
    isBanned: !!row.is_banned,
    address: parseJson(row.address_json, null),
    referredBy: row.referred_by ? normalizeMobile(row.referred_by) || row.referred_by : '',
    profession: row.profession || '',
    createdAt: row.created_at,
  };
  if (includeSensitive) user.password = row.password;
  return user;
};

export const mapCategory = (row: any) =>
  row
    ? {
        _id: row.id,
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        image: row.image || '',
        icon: row.icon || '',
        type: row.type || 'general',
        isActive: !!row.is_active,
        hideFromHome: !!row.hide_from_home,
        hideFromProductList: !!row.hide_from_catalog,
        sortOrder: row.sort_order != null ? Number(row.sort_order) : 0,
        createdAt: row.created_at,
      }
    : null;

export const referralPhone = (addr: any, user?: any) => {
  const fromAddr = String(addr?.referenceNumber || addr?.referralCode || '').trim();
  const fromUser = String(user?.referred_by || user?.referredBy || '').trim();
  const raw = fromAddr || fromUser;
  if (!raw) return '';
  return normalizeMobile(raw) || raw;
};

export const mapOrder = (row: any, user?: any) => {
  if (!row) return null;
  const deliveryAddress = parseJson(row.delivery_address_json, {});
  const mappedUser = user
    ? {
        _id: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        referredBy: referralPhone(null, user),
      }
    : row.user_id;
  return {
    _id: row.id,
    id: row.id,
    user: mappedUser,
    orderNumber: row.order_number,
    items: parseJson(row.items_json, []),
    deliveryAddress,
    referralMobile: referralPhone(deliveryAddress, user),
    orderNotes: row.order_notes,
    paymentMethod: row.payment_method,
    subtotal: row.subtotal,
    deliveryCharge: row.delivery_charge,
    total: row.total,
    status: row.status,
    statusHistory: parseJson(row.status_history_json, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapReview = (row: any, extra: Record<string, unknown> = {}) =>
  row
    ? {
        _id: row.id,
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        isHidden: !!row.is_hidden,
        createdAt: row.created_at,
        ...extra,
      }
    : null;

export const mapMembershipApp = (row: any) =>
  row
    ? {
        _id: row.id,
        id: row.id,
        userId: row.user_id,
        fullName: row.full_name,
        profession: row.profession || '',
        mobile: row.mobile,
        photo: row.photo,
        status: row.status,
        adminNote: row.admin_note || '',
        fee: row.fee,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
