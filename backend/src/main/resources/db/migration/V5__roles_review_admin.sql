-- Shop review: new shops wait for an admin before customers can see them.
ALTER TABLE shops ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'APPROVED'; -- shops that already exist stay live
ALTER TABLE shops ALTER COLUMN status SET DEFAULT 'PENDING';
ALTER TABLE shops ADD CONSTRAINT chk_shops_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'));
ALTER TABLE shops ADD COLUMN review_note VARCHAR(500);
ALTER TABLE shops ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shops ADD COLUMN reviewed_by VARCHAR(255);
ALTER TABLE shops ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE;
UPDATE shops SET submitted_at = created_at;
CREATE INDEX idx_shops_status ON shops (status);

-- LocalKart staff accounts. Created by a super admin (or the SUPER_ADMIN_* bootstrap), never by public sign-up.
CREATE TABLE admins (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    name          VARCHAR(120) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(16)  NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    token_version INTEGER      NOT NULL DEFAULT 0,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_admins_role CHECK (role IN ('ADMIN', 'SUPER_ADMIN'))
);

-- Who did what in the admin area (approvals, suspensions, admin changes).
CREATE TABLE audit_log (
    id           BIGSERIAL PRIMARY KEY,
    admin_id     UUID,
    admin_email  VARCHAR(255) NOT NULL,
    action       VARCHAR(40)  NOT NULL,
    target_type  VARCHAR(20)  NOT NULL,
    target_id    VARCHAR(64),
    target_label VARCHAR(200),
    details      VARCHAR(500),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_created ON audit_log (created_at DESC);
