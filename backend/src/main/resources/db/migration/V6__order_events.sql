-- A customer sent an order to the shop from the LocalKart cart (WhatsApp, or copied to call).
ALTER TABLE shop_events DROP CONSTRAINT chk_shop_events_type;
ALTER TABLE shop_events ADD CONSTRAINT chk_shop_events_type CHECK (type IN ('VIEW', 'CALL', 'WHATSAPP', 'DIRECTIONS', 'ORDER'));
