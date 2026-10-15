package com.localkart.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ProductView(
		@JsonProperty("_id") UUID id,
		UUID shop,
		String name,
		String category,
		BigDecimal price,
		String unit,
		boolean inStock,
		String description,
		Instant createdAt,
		Instant updatedAt) {

	public static ProductView of(Product p) {
		return new ProductView(p.getId(), p.getShopId(), p.getName(), p.getCategory(), p.getPrice(), p.getUnit(),
				p.isInStock(), p.getDescription(), p.getCreatedAt(), p.getUpdatedAt());
	}
}
