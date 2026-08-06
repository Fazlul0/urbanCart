-- Site branding (name + logo) editable from admin
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT 'UrbanCart',
  logo_url TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO site_settings (id, site_name, logo_url, tagline)
VALUES (
  'default',
  'UrbanCart',
  '',
  'Premium men''s accessories curated for the modern gentleman.'
);
