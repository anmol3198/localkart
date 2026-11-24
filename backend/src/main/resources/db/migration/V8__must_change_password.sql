-- Set when LocalKart staff issue a temporary password; the owner must choose their own before doing anything else.
ALTER TABLE shops ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
