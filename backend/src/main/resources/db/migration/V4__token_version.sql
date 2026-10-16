-- Bumped on "log out of all devices" and password change; login tokens carry it, so older tokens stop working.
ALTER TABLE shops ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0;
