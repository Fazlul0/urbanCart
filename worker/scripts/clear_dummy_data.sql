-- Wipe demo / seed catalog data; keep admin user + site/membership settings
DELETE FROM cart_items;
DELETE FROM carts;
DELETE FROM reviews;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM hero_images;
DELETE FROM membership_applications;
DELETE FROM users WHERE role != 'admin';
