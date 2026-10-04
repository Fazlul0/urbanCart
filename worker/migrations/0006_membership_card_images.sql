-- Membership card images: home title + front/back detail views
ALTER TABLE membership_settings ADD COLUMN home_image TEXT DEFAULT '';
ALTER TABLE membership_settings ADD COLUMN card_front TEXT DEFAULT '';
ALTER TABLE membership_settings ADD COLUMN card_back TEXT DEFAULT '';

-- Seed from existing card_image when present
UPDATE membership_settings
SET home_image = COALESCE(NULLIF(home_image, ''), card_image),
    card_front = COALESCE(NULLIF(card_front, ''), card_image)
WHERE id = 'default';
