package com.localkart.product;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.localkart.common.OnCreate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** All fields optional on update; name and price are required on create. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ProductRequest(
		@NotBlank(groups = OnCreate.class, message = "Item name is required")
		@Pattern(regexp = "(?s)^(?=.*[\\p{L}\\p{N}]).{2,150}$", message = "Item name must be 2-150 characters") String name,
		@Size(max = 80, message = "Category is too long") String category,
		@NotNull(groups = OnCreate.class, message = "Price is required")
		@PositiveOrZero(message = "Price cannot be negative")
		@DecimalMax(value = "1000000", message = "Price can be at most ₹10,00,000")
		@Digits(integer = 7, fraction = 2, message = "Price can have at most 2 decimal places") BigDecimal price,
		@Size(max = 30, message = "Unit is too long") String unit,
		Boolean inStock,
		@Size(max = 300, message = "Description must be at most 300 characters") String description,
		// Empty string clears it. Spaces are removed, then length and EAN/UPC check digits are verified in Barcodes.
		@Pattern(regexp = "^[0-9A-Za-z\\- ]{0,40}$", message = "Barcode can only have letters, numbers and dashes (4-32 characters)") String barcode) {

	public ProductRequest {
		name = name == null ? null : name.trim();
	}
}
