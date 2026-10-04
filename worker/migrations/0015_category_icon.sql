-- Category icon (small image shown next to name on storefront)
ALTER TABLE categories ADD COLUMN icon TEXT DEFAULT '';

-- Fix empty slugs from Bengali/non-latin names that broke UNIQUE updates
UPDATE categories
SET slug = 'cat-' || lower(substr(replace(id, '-', ''), 1, 8))
WHERE slug IS NULL OR trim(slug) = '';
