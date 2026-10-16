-- Optional barcode (EAN/UPC on packaged goods, or the shop's own code) so owners can scan to find/add items.
ALTER TABLE products ADD COLUMN barcode VARCHAR(32);

-- An item code can belong to only one item per shop.
CREATE UNIQUE INDEX uq_products_shop_barcode ON products (shop_id, barcode) WHERE barcode IS NOT NULL;
