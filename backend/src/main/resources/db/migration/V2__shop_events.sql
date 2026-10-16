-- Customer activity on a shop (page views and contact taps), used for the vendor "Insights" dashboard.
CREATE TABLE shop_events (
    id           BIGSERIAL PRIMARY KEY,
    shop_id      UUID        NOT NULL REFERENCES shops (id) ON DELETE CASCADE,
    type         VARCHAR(16) NOT NULL,
    source       VARCHAR(10) NOT NULL,
    -- One-way hash of an anonymous device id (or IP + user agent); never the raw value
    visitor_hash VARCHAR(64) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT chk_shop_events_type CHECK (type IN ('VIEW', 'CALL', 'WHATSAPP', 'DIRECTIONS')),
    CONSTRAINT chk_shop_events_source CHECK (source IN ('WEB', 'ANDROID', 'IOS'))
);

CREATE INDEX idx_shop_events_shop_time ON shop_events (shop_id, created_at);
CREATE INDEX idx_shop_events_dedupe ON shop_events (shop_id, visitor_hash, type, created_at);
