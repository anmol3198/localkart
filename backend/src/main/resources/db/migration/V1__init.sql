CREATE TABLE shops (
    id                 UUID PRIMARY KEY,
    owner_name         VARCHAR(120)     NOT NULL,
    email              VARCHAR(255)     NOT NULL UNIQUE,
    password_hash      VARCHAR(100)     NOT NULL,
    shop_name          VARCHAR(120)     NOT NULL,
    phone              VARCHAR(16)      NOT NULL,
    alternate_phone    VARCHAR(16),
    category           VARCHAR(40)      NOT NULL,
    description        VARCHAR(500),
    address            VARCHAR(300)     NOT NULL,
    latitude           DOUBLE PRECISION NOT NULL,
    longitude          DOUBLE PRECISION NOT NULL,
    opening_hours      VARCHAR(80),
    is_open            BOOLEAN          NOT NULL DEFAULT TRUE,
    home_delivery      BOOLEAN          NOT NULL DEFAULT FALSE,
    delivery_radius_km DOUBLE PRECISION NOT NULL DEFAULT 2,
    min_order_amount   NUMERIC(10, 2)   NOT NULL DEFAULT 0,
    delivery_charge    NUMERIC(10, 2)   NOT NULL DEFAULT 0,
    created_at         TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at         TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_shops_delivery_radius CHECK (delivery_radius_km >= 0 AND delivery_radius_km <= 5)
);

-- Nearby search prefilters with a lat/lng bounding box
CREATE INDEX idx_shops_lat_lng ON shops (latitude, longitude);

CREATE TABLE products (
    id          UUID PRIMARY KEY,
    shop_id     UUID           NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
    name        VARCHAR(150)   NOT NULL,
    category    VARCHAR(80)    NOT NULL,
    price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    unit        VARCHAR(30)    NOT NULL,
    in_stock    BOOLEAN        NOT NULL DEFAULT TRUE,
    description VARCHAR(300),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_products_shop ON products (shop_id);
