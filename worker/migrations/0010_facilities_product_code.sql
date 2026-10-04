-- Membership partner facilities & shops + product SKU code
CREATE TABLE IF NOT EXISTS membership_facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS membership_shops (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  owner_name TEXT DEFAULT '',
  owner_mobile TEXT DEFAULT '',
  location TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (facility_id) REFERENCES membership_facilities(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_membership_shops_facility ON membership_shops(facility_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_membership_facilities_sort ON membership_facilities(sort_order);

ALTER TABLE products ADD COLUMN product_code TEXT DEFAULT '';

UPDATE products
SET product_code = 'SM-' || upper(substr(replace(id, '-', ''), 1, 8))
WHERE product_code IS NULL OR product_code = '';

-- Default facilities (ids stable for seed shops)
INSERT OR IGNORE INTO membership_facilities (id, name, slug, description, sort_order, is_active)
VALUES
  ('fac-maintenance', 'Maintenance', 'maintenance', 'Partner garages for mechanical service', 1, 1),
  ('fac-washing', 'Washing', 'washing', 'Car washing & cleaning centers', 2, 1),
  ('fac-equipment', 'Equipment', 'equipment', 'Spare parts & equipment shops', 3, 1);
