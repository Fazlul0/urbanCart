-- Membership apply fields: name, profession, mobile, photo (NID removed from form)
ALTER TABLE membership_applications ADD COLUMN profession TEXT NOT NULL DEFAULT '';
