package com.localkart.shop;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.localkart.common.OnCreate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Shop profile fields a vendor may set. Every field is optional on update (only non-null fields are
 * applied); the {@link OnCreate} constraints make the essentials required at registration.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ShopRequest {

	@NotBlank(groups = OnCreate.class, message = "Shop name is required")
	@Size(max = 120, message = "Shop name is too long")
	private String shopName;

	@NotBlank(groups = OnCreate.class, message = "Phone number is required")
	@Pattern(regexp = "^\\+?[0-9]{10,13}$", message = "Enter a valid 10-digit phone number")
	private String phone;

	@Pattern(regexp = "^$|^\\+?[0-9]{10,13}$", message = "Enter a valid alternate phone number")
	private String alternatePhone;

	private String category;

	@Size(max = 500, message = "Description must be at most 500 characters")
	private String description;

	@NotBlank(groups = OnCreate.class, message = "Address is required")
	@Size(max = 300, message = "Address is too long")
	private String address;

	@Size(max = 80, message = "Opening hours is too long")
	private String openingHours;

	@JsonProperty("isOpen")
	private Boolean isOpen;

	private Boolean homeDelivery;

	@DecimalMin(value = "0", message = "Delivery radius cannot be negative")
	@DecimalMax(value = "5", message = "Delivery radius can be at most 5 km")
	private Double deliveryRadiusKm;

	@PositiveOrZero(message = "Minimum order cannot be negative")
	private BigDecimal minOrderAmount;

	@PositiveOrZero(message = "Delivery charge cannot be negative")
	private BigDecimal deliveryCharge;

	@NotNull(groups = OnCreate.class, message = "Shop location is required")
	@DecimalMin(value = "-90", message = "Invalid coordinates")
	@DecimalMax(value = "90", message = "Invalid coordinates")
	private Double lat;

	@NotNull(groups = OnCreate.class, message = "Shop location is required")
	@DecimalMin(value = "-180", message = "Invalid coordinates")
	@DecimalMax(value = "180", message = "Invalid coordinates")
	private Double lng;
}
