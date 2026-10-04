import type { Env } from '../lib/helpers';
import { uid, slugify } from '../lib/helpers';
import { hashPassword } from '../lib/auth';

const categories = [
  {
    name: 'Car Cleaning',
    description: 'Car wash kits, microfiber cloths, and detailing brushes',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&q=80',
  },
  {
    name: 'Automotive Electronics',
    description: 'Chargers, dash cams, and smart gadgets for your car',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80',
  },
  {
    name: 'Perfume & Showpiece',
    description: 'Car fragrances and decorative cabin accessories',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80',
  },
  {
    name: 'Covers',
    description: 'Seat covers, steering covers, and protective mats',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80',
  },
  {
    name: 'Lights',
    description: 'LED interior lights, fog lamps, and ambient strips',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80',
  },
  {
    name: 'Car Multimedia',
    description: 'Head units, speakers, and Bluetooth audio adapters',
    image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80',
  },
];

const productsByCategory: Record<string, any[]> = {
  'Car Cleaning': [
    {
      name: 'Microfiber Detailing Cloth Set',
      description: 'Pack of 6 ultra-soft microfiber cloths for paint-safe washing and waxing.',
      price: 890,
      tags: ['cleaning', 'microfiber'],
      stockQuantity: 80,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Pack: '6 pcs', Material: 'Microfiber 300 GSM' },
    },
    {
      name: 'Foam Cannon Wash Kit',
      description: 'High-foam car wash kit with spray bottle and snow-foam concentrate starter.',
      price: 2490,
      tags: ['cleaning', 'wash'],
      stockQuantity: 35,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Includes: 'Foam bottle + wash mitt', Use: 'Exterior wash' },
    },
  ],
  'Automotive Electronics': [
    {
      name: 'Magnetic Phone Mount',
      description: 'Strong magnetic dashboard/vent mount with 360° rotation for navigation.',
      price: 1290,
      tags: ['electronics', 'mount'],
      stockQuantity: 60,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Mount: 'Magnetic', Fit: 'Most smartphones' },
    },
    {
      name: 'Dual USB Fast Car Charger',
      description: '36W dual-port USB-A + USB-C car charger with smart current detection.',
      price: 790,
      tags: ['electronics', 'charger'],
      stockQuantity: 100,
      featured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Output: '36W total', Ports: 'USB-A + USB-C' },
    },
  ],
  'Perfume & Showpiece': [
    {
      name: 'Luxury Cabin Air Freshener',
      description: 'Long-lasting premium car perfume with wooden diffuser clip.',
      price: 650,
      tags: ['perfume', 'fragrance'],
      stockQuantity: 90,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Scent: 'Ocean Breeze', Duration: 'Up to 60 days' },
    },
    {
      name: 'Dashboard Ornament Showpiece',
      description: 'Elegant resin dashboard showpiece with non-slip base.',
      price: 990,
      tags: ['showpiece', 'decor'],
      stockQuantity: 45,
      featured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Material: 'Resin', Base: 'Anti-slip pad' },
    },
  ],
  Covers: [
    {
      name: 'Universal Seat Cover Pair',
      description: 'Breathable fabric front seat covers with easy install straps.',
      price: 1890,
      tags: ['covers', 'seats'],
      stockQuantity: 40,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Fit: 'Most sedan/SUV', Pack: '2 front seats' },
    },
    {
      name: 'Leather Steering Wheel Cover',
      description: 'Soft PU leather steering cover with anti-slip inner lining.',
      price: 750,
      tags: ['covers', 'steering'],
      stockQuantity: 70,
      featured: false,
      images: [
        { url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Size: '37–38 cm', Material: 'PU Leather' },
    },
  ],
  Lights: [
    {
      name: 'RGB Ambient Light Strip',
      description: 'App-controlled RGB LED strip for footwell and dashboard glow.',
      price: 1590,
      tags: ['lights', 'led', 'rgb'],
      stockQuantity: 55,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Length: '5 m', Control: 'App / remote' },
    },
  ],
  'Car Multimedia': [
    {
      name: 'Bluetooth Audio Receiver',
      description: 'Plug-and-play Bluetooth AUX receiver for older stereo systems.',
      price: 890,
      tags: ['multimedia', 'bluetooth'],
      stockQuantity: 65,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Connection: 'AUX 3.5mm', Codec: 'SBC / AAC' },
    },
    {
      name: 'Wireless CarPlay Adapter',
      description: 'Convert wired CarPlay to wireless for iPhone — plug into USB and go.',
      price: 3990,
      tags: ['multimedia', 'carplay'],
      stockQuantity: 30,
      featured: true,
      images: [
        { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', isThumbnail: true },
      ],
      specifications: { Compatibility: 'CarPlay vehicles', Connect: 'USB' },
    },
  ],
};

const DEFAULT_FOOTER_LINKS = [
  { label: 'ফিটনেস এ্যাপয়েন্টমেন্টের সময়সূচি', url: '/contact' },
  { label: 'রেজিস্ট্রেশন ফি ও নবায়ন', url: '/contact' },
  { label: 'ট্যাক্স টোকেন ও রুট পারমিট ফি', url: '/contact' },
  { label: 'সার্ভিস চার্জ ও ডেলিভারি ফি', url: '/contact' },
  { label: 'নিবন্ধিত মোটরযানের ফি', url: '/contact' },
];

export async function seedDatabase(env: Env) {
  // Replace catalog only — keep orders, membership, site branding, admins
  await env.DB.batch([
    env.DB.prepare('DELETE FROM reviews'),
    env.DB.prepare('DELETE FROM cart_items'),
    env.DB.prepare('DELETE FROM products'),
    env.DB.prepare('DELETE FROM categories'),
  ]);

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
  let sort = 1;
  for (const cat of categories) {
    const id = uid();
    categoryMap[cat.name] = id;
    await env.DB.prepare(
      `INSERT INTO categories (id, name, slug, description, image, is_active, type, sort_order)
       VALUES (?, ?, ?, ?, ?, 1, 'general', ?)`
    )
      .bind(id, cat.name, slugify(cat.name), cat.description, cat.image, sort++)
      .run();
  }

  let productSort = 1;
  for (const [catName, items] of Object.entries(productsByCategory)) {
    for (const item of items) {
      await env.DB.prepare(
        `INSERT INTO products
         (id, name, description, price, category_id, images_json, availability, stock_quantity,
          tags_json, specifications_json, rating, total_reviews, featured, sold_count, is_active,
          product_type, unit_type, min_order, free_delivery, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, 'in_stock', ?, ?, ?, ?, ?, ?, ?, 1, 'general', 'piece', 1, 0, ?)`
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
          Math.floor(Math.random() * 50),
          productSort++
        )
        .run();
    }
  }

  // Ensure sensible default footer links if empty
  const settings = await env.DB.prepare(`SELECT footer_links_json FROM site_settings WHERE id = 'default'`).first<any>();
  if (settings && (!settings.footer_links_json || settings.footer_links_json === '[]')) {
    await env.DB.prepare(`UPDATE site_settings SET footer_links_json = ? WHERE id = 'default'`)
      .bind(JSON.stringify(DEFAULT_FOOTER_LINKS))
      .run();
  }

  return {
    categories: categories.length,
    products: Object.values(productsByCategory).flat().length,
    admin: env.ADMIN_EMAIL,
    demo: 'demo@urbancart.com / Demo@123',
  };
}
