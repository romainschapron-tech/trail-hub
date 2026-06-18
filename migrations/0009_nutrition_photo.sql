-- Track which products we've already attempted to enrich with a photo.
ALTER TABLE nutrition_products ADD COLUMN photo_tried INTEGER DEFAULT 0;
