package com.localkart.product;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.localkart.common.OnCreate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** All fields optional on update; name and price are required on create. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductRequest(
		@NotBlank(groups = OnCreate.class, message = "Item name is required")
		@Size(max = 150, message = "Item name is too long") String name,
		@Size(max = 80, message = "Category is too long") String category,
		@NotNull(groups = OnCreate.class, message = "Price is required")
		@PositiveOrZero(message = "Price cannot be negative") BigDecimal price,
		@Size(max = 30, message = "Unit is too long") String unit,
		Boolean inStock,
		@Size(max = 300, message = "Description must be at most 300 characters") String description) {
}
