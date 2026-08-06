-- Hero carousel images managed from admin
CREATE TABLE IF NOT EXISTS hero_images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  alt TEXT DEFAULT '',
  position TEXT DEFAULT 'center center',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hero_sort ON hero_images(sort_order);
