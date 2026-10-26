-- When a shop owner accepted the Terms and Privacy Policy, and which version (proof of consent).
-- Shops registered before this stay NULL: they accepted nothing in the app.
ALTER TABLE shops ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shops ADD COLUMN terms_version VARCHAR(20);
