package com.localkart.shop;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.localkart.common.IndianPhone;
import com.localkart.common.OnCreate;
import com.localkart.common.PhoneNumbers;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
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
	@Pattern(regexp = "(?s)^(?=.*[\\p{L}\\p{N}]).{2,120}$", message = "Shop name must be 2-120 characters and include letters or numbers")
	private String shopName;

	@NotBlank(groups = OnCreate.class, message = "Phone number is required")
	@IndianPhone
	private String phone;

	@IndianPhone(allowBlank = true, message = "Alternate phone: " + PhoneNumbers.INVALID)
	private String alternatePhone;

	private String category;

	@Size(max = 500, message = "Description must be at most 500 characters")
	private String description;

	@NotBlank(groups = OnCreate.class, message = "Address is required")
	@Pattern(regexp = "(?s)^(?=.*\\p{L}).{5,300}$", message = "Enter the full address (5-300 characters, e.g. shop no., street, area)")
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
	@DecimalMax(value = "100000", message = "Minimum order can be at most ₹1,00,000")
	@Digits(integer = 6, fraction = 2, message = "Minimum order can have at most 2 decimal places")
	private BigDecimal minOrderAmount;

	@PositiveOrZero(message = "Delivery charge cannot be negative")
	@DecimalMax(value = "5000", message = "Delivery charge can be at most ₹5,000")
	@Digits(integer = 4, fraction = 2, message = "Delivery charge can have at most 2 decimal places")
	private BigDecimal deliveryCharge;

	@NotNull(groups = OnCreate.class, message = "Shop location is required")
	// LocalKart serves shops in India: roughly its latitude/longitude box.
	@DecimalMin(value = "6", message = "Shop location must be in India")
	@DecimalMax(value = "37.5", message = "Shop location must be in India")
	private Double lat;

	@NotNull(groups = OnCreate.class, message = "Shop location is required")
	@DecimalMin(value = "68", message = "Shop location must be in India")
	@DecimalMax(value = "97.5", message = "Shop location must be in India")
	private Double lng;

	// Clean input before validation (Jackson calls these setters): trim text, accept "+91 98765-43210" etc.
	public void setShopName(String shopName) {
		this.shopName = shopName == null ? null : shopName.trim();
	}

	public void setAddress(String address) {
		this.address = address == null ? null : address.trim();
	}

	public void setPhone(String phone) {
		this.phone = PhoneNumbers.normalize(phone);
	}

	public void setAlternatePhone(String alternatePhone) {
		this.alternatePhone = PhoneNumbers.normalize(alternatePhone);
	}
}
