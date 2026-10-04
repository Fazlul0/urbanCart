-- Lost card replacement fee (admin-editable)
ALTER TABLE membership_settings ADD COLUMN lost_card_fee INTEGER NOT NULL DEFAULT 200;

UPDATE membership_settings SET lost_card_fee = 200 WHERE id = 'default' AND (lost_card_fee IS NULL OR lost_card_fee = 0);
