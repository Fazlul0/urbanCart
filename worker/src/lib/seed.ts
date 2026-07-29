import type { Env } from '../lib/helpers';
import { uid, slugify } from '../lib/helpers';
import { hashPassword } from '../lib/auth';

const categories = [
  {
    name: 'Watches',
    description: 'Premium timepieces for the modern gentleman',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  },
  {
    name: 'Wallets',
    description: 'Leather wallets crafted for everyday elegance',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594f93?w=600&q=80',
  },
  {
    name: 'Car Accessories',
    description: 'Stylish upgrades for your ride',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80',
  },
  {
    name: "Men's Collection",
    description: 'Curated fashion accessories for men',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80',
  },
  {
    name: 'Sunglasses',
    description: 'UV-protected eyewear with attitude',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80',
  },
  {
    name: 'Belts',
    description: 'Premium leather belts',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
  },
];

const productsByCategory: Record<string, any[]> = {
  Watches: [
    {
      name: 'Aurora Chronograph Watch',
      description:
        'A refined chronograph with a stainless steel case, sapphire crystal, and genuine leather strap. Water resistant to 50m.',
      price: 8990,
      tags: ['watch', 'chronograph', 'leather'],
      stockQuantity: 25,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', isThumbnail: true },
        { url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80', isThumbnail: false },
      ],
      specifications: { Case: '42mm Stainless Steel', Movement: 'Quartz Chronograph', Strap: 'Genuine Leather' },
    },
    {
      name: 'Noir Minimalist Watch',
      description: 'Ultra-slim black dial watch with mesh bracelet.',
      price: 5490,
      tags: ['watch', 'minimalist'],
      stockQuantity: 40,
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80', isThumbnail: true }],
      specifications: { Case: '40mm', Movement: 'Japanese Quartz' },
    },
    {
      name: 'Heritage Gold Watch',
      description: 'Gold-accented dress watch with Roman numerals.',
      price: 12990,
      tags: ['watch', 'gold'],
      stockQuantity: 15,
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800&q=80', isThumbnail: true }],
      specifications: { Case: '40mm Gold Plated', Dial: 'Roman Numerals' },
    },
  ],
  Wallets: [
    {
      name: 'Classic Leather Bifold Wallet',
      description: 'Handcrafted full-grain leather bifold with RFID protection.',
      price: 2490,
      tags: ['wallet', 'leather', 'rfid'],
      stockQuantity: 50,
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594f93?w=800&q=80', isThumbnail: true }],
      specifications: { Material: 'Full Grain Leather', Feature: 'RFID Blocking' },
    },
    {
      name: 'Slim Card Holder',
      description: 'Minimalist slim wallet for cards and cash.',
      price: 1290,
      tags: ['wallet', 'slim'],
      stockQuantity: 60,
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1606503825008-909a67e63c3d?w=800&q=80', isThumbnail: true }],
      specifications: { Material: 'Genuine Leather', Capacity: '6 Cards' },
    },
    {
      name: 'Money Clip Wallet',
      description: 'Compact money clip wallet with premium stitching.',
      price: 1890,
      tags: ['wallet', 'money clip'],
      stockQuantity: 35,
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', isThumbnail: true }],
      specifications: { Material: 'Leather', Feature: 'Steel Money Clip' },
    },
  ],
  'Car Accessories': [
    {
      name: 'Carbon Fiber Phone Mount',
      description: 'Magnetic car phone mount with carbon fiber finish.',
      price: 1590,
      tags: ['car', 'phone mount'],
      stockQuantity: 45,
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80', isThumbnail: true }],
      specifications: { Mount: 'Magnetic', Finish: 'Carbon Fiber Look' },
    },
    {
      name: 'LED Looking Glass Mirror',
      description: 'Wide-angle rearview looking glass with LED ambient lighting.',
      price: 3290,
      tags: ['car', 'mirror', 'led'],
      stockQuantity: 20,
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80', isThumbnail: true }],
      specifications: { Type: 'Wide Angle', Feature: 'LED Light' },
    },
    {
      name: 'Premium Seat Organizer',
      description: 'Multi-pocket seat back organizer for tidy interiors.',
      price: 990,
      tags: ['car', 'organizer'],
      stockQuantity: 55,
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80', isThumbnail: true }],
      specifications: { Material: 'Oxford Fabric', Pockets: '8 Multi-size' },
    },
  ],
  "Men's Collection": [
    {
      name: 'Signature Cologne Gift Set',
      description: "Exclusive men's fragrance set with eau de toilette and aftershave.",
      price: 4490,
      tags: ['fragrance', 'gift'],
      stockQuantity: 30,
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80', isThumbnail: true }],
      specifications: { Volume: '100ml EDT + 50ml Aftershave' },
    },
    {
      name: 'Travel Grooming Kit',
      description: 'Compact leather pouch with essential grooming tools.',
      price: 2790,
      tags: ['grooming', 'travel'],
      stockQuantity: 40,
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80', isThumbnail: true }],
      specifications: { Includes: '6 Tools', Pouch: 'Genuine Leather' },
    },
  ],
  Sunglasses: [
    {
      name: 'Aviator Gold Sunglasses',
      description: 'Classic aviator frames with gold finish and polarized UV400 lenses.',
      price: 3490,
      tags: ['sunglasses', 'aviator'],
      stockQuantity: 35,
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80', isThumbnail: true }],
      specifications: { Lens: 'Polarized UV400', Style: 'Aviator' },
    },
    {
      name: 'Matte Black Wayfarer',
      description: 'Bold matte black wayfarer sunglasses with scratch-resistant lenses.',
      price: 2990,
      tags: ['sunglasses', 'wayfarer'],
      stockQuantity: 42,
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', isThumbnail: true }],
      specifications: { Lens: 'UV400', Style: 'Wayfarer' },
    },
  ],
  Belts: [
    {
      name: 'Full Grain Leather Belt',
      description: 'Premium full-grain leather belt with brushed steel buckle.',
      price: 1990,
      tags: ['belt', 'leather'],
      stockQuantity: 50,
      featured: true,
      images: [{ url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', isThumbnail: true }],
      specifications: { Material: 'Full Grain Leather', Width: '35mm' },
    },
    {
      name: 'Reversible Dual Tone Belt',
      description: 'Reversible black/brown belt for versatile styling.',
      price: 2290,
      tags: ['belt', 'reversible'],
      stockQuantity: 28,
      featured: false,
      images: [{ url: 'https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=800&q=80', isThumbnail: true }],
      specifications: { Colors: 'Black / Brown', Feature: 'Reversible' },
    },
  ],
};

export async function seedDatabase(env: Env) {
  // Clear tables
  await env.DB.batch([
    env.DB.prepare('DELETE FROM reviews'),
    env.DB.prepare('DELETE FROM cart_items'),
    env.DB.prepare('DELETE FROM carts'),
    env.DB.prepare('DELETE FROM orders'),
    env.DB.prepare('DELETE FROM products'),
    env.DB.prepare('DELETE FROM categories'),
    env.DB.prepare(`DELETE FROM users WHERE role != 'admin' OR email = ?`).bind('demo@urbancart.com'),
  ]);

  // Admin
  let admin = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(env.ADMIN_EMAIL)
    .first<{ id: string }>();
  if (!admin) {
    const id = uid();
    await env.DB.prepare(
      `INSERT INTO users (id, name, email, password, mobile, role) VALUES (?, 'Admin', ?, ?, '01700000000', 'admin')`
    )
      .bind(id, env.ADMIN_EMAIL, await hashPassword(env.ADMIN_PASSWORD))
      .run();
  }

  await env.DB.prepare(`DELETE FROM users WHERE email = 'demo@urbancart.com'`).run();

  const demoId = uid();
  await env.DB.prepare(
    `INSERT INTO users (id, name, email, password, mobile, role) VALUES (?, 'Demo Customer', 'demo@urbancart.com', ?, '01712345678', 'user')`
  )
    .bind(demoId, await hashPassword('Demo@123'))
    .run();

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const id = uid();
    categoryMap[cat.name] = id;
    await env.DB.prepare(
      `INSERT INTO categories (id, name, slug, description, image, is_active) VALUES (?, ?, ?, ?, ?, 1)`
    )
      .bind(id, cat.name, slugify(cat.name), cat.description, cat.image)
      .run();
  }

  for (const [catName, items] of Object.entries(productsByCategory)) {
    for (const item of items) {
      await env.DB.prepare(
        `INSERT INTO products
         (id, name, description, price, category_id, images_json, availability, stock_quantity, tags_json, specifications_json, rating, total_reviews, featured, sold_count, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 'in_stock', ?, ?, ?, ?, ?, ?, ?, 1)`
      )
        .bind(
          uid(),
          item.name,
          item.description,
          item.price,
          categoryMap[catName],
          JSON.stringify(item.images),
          item.stockQuantity,
          JSON.stringify(item.tags),
          JSON.stringify(item.specifications || {}),
          +(Math.random() * 1.5 + 3.5).toFixed(1),
          Math.floor(Math.random() * 20) + 2,
          item.featured ? 1 : 0,
          Math.floor(Math.random() * 50)
        )
        .run();
    }
  }

  return {
    categories: categories.length,
    products: Object.values(productsByCategory).flat().length,
    admin: env.ADMIN_EMAIL,
    demo: 'demo@urbancart.com / Demo@123',
  };
}
