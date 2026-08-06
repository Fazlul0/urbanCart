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
};

export const uid = () => crypto.randomUUID();

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const deliveryCharge = (env: Env) => Number(env.DELIVERY_CHARGE || 80);

export const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const mapProduct = (row: any, category?: any) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
        image: row.image,
        type: row.type || 'general',
        isActive: !!row.is_active,
        createdAt: row.created_at,
      }
    : null;

export const mapOrder = (row: any, user?: any) =>
  row
    ? {
        _id: row.id,
        id: row.id,
        user: user
          ? { _id: user.id, id: user.id, name: user.name, email: user.email, mobile: user.mobile }
          : row.user_id,
        orderNumber: row.order_number,
        items: parseJson(row.items_json, []),
        deliveryAddress: parseJson(row.delivery_address_json, {}),
        orderNotes: row.order_notes,
        paymentMethod: row.payment_method,
        subtotal: row.subtotal,
        deliveryCharge: row.delivery_charge,
        total: row.total,
        status: row.status,
        statusHistory: parseJson(row.status_history_json, []),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;

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
