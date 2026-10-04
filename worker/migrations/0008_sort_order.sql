-- Display order for categories and products (lower number = shown first)
ALTER TABLE categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(type, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(product_type, sort_order);

-- Seed initial order from existing row ids so lists aren't all zeros
UPDATE categories SET sort_order = rowid;
UPDATE products SET sort_order = rowid;
