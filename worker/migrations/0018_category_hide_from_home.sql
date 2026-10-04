-- Hide category products from Home / unfiltered product lists (still visible when browsing the category)
ALTER TABLE categories ADD COLUMN hide_from_home INTEGER NOT NULL DEFAULT 0;
