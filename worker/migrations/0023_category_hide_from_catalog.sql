-- Hide category products from the All Products list (still visible when that category is selected)
ALTER TABLE categories ADD COLUMN hide_from_catalog INTEGER NOT NULL DEFAULT 0;
