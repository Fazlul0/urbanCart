-- Food product fields + category type
ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'general';
-- type: general | food

ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'general';
-- product_type: general | food

ALTER TABLE products ADD COLUMN unit_type TEXT NOT NULL DEFAULT 'piece';
-- unit_type: piece | kg | g

ALTER TABLE products ADD COLUMN min_order REAL NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN free_delivery INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_free_delivery ON products(free_delivery);

-- Membership settings (singleton row id = 'default')
CREATE TABLE IF NOT EXISTS membership_settings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'UrbanCart Membership',
  subtitle TEXT DEFAULT '',
  fee REAL NOT NULL DEFAULT 0,
  card_image TEXT DEFAULT '',
  features_json TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO membership_settings (id, title, subtitle, fee, features_json, is_active)
VALUES (
  'default',
  'UrbanCart Gold Membership',
  'Exclusive perks for loyal customers',
  999,
  '["🚚 **ফ্রি ডেলিভারি**\nসব অর্ডারে বিনামূল্যে ডেলিভারি সুবিধা","🏷️ **সদস্য ছাড়**\nমেম্বারদের জন্য বিশেষ ডিসকাউন্ট ও অফার","🎧 **অগ্রাধিকার সাপোর্ট**\nপ্রাধান্যভিত্তিক কাস্টমার সাপোর্ট","✨ **নতুন পণ্যে আগে সুযোগ**\nনতুন পণ্যে আগেই অ্যাক্সেস"]',
  1
);

CREATE TABLE IF NOT EXISTS membership_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT NOT NULL,
  nid_number TEXT NOT NULL,
  nid_image TEXT NOT NULL,
  photo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT DEFAULT '',
  fee REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_membership_status ON membership_applications(status);

-- Allow fractional qty for food weight (kg/g)
-- SQLite can't ALTER column type; recreate cart_items if needed via new nullable approach:
-- Keep INTEGER-compatible storage as REAL by rewriting table
CREATE TABLE IF NOT EXISTS cart_items_new (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity REAL NOT NULL DEFAULT 1,
  UNIQUE(cart_id, product_id)
);
INSERT OR IGNORE INTO cart_items_new (id, cart_id, product_id, quantity)
  SELECT id, cart_id, product_id, quantity FROM cart_items;
DROP TABLE IF EXISTS cart_items;
ALTER TABLE cart_items_new RENAME TO cart_items;
