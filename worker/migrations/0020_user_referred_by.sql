-- Persist referrer mobile captured at registration
ALTER TABLE users ADD COLUMN referred_by TEXT;
