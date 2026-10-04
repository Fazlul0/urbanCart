-- Delivery charge in site settings (admin-editable); default 120
ALTER TABLE site_settings ADD COLUMN delivery_charge INTEGER NOT NULL DEFAULT 120;

UPDATE site_settings SET delivery_charge = 120 WHERE id = 'default';

-- Membership offer product code (shown near Apply)
ALTER TABLE membership_settings ADD COLUMN product_code TEXT DEFAULT '';

-- Lost card applications (approved members)
CREATE TABLE IF NOT EXISTS lost_card_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  mobile TEXT NOT NULL DEFAULT '',
  note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lost_card_user ON lost_card_applications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(delivery_address_json);
