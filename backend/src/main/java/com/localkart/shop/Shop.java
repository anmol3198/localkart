package com.localkart.shop;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** A registered shop. The vendor account and the shop profile are one record. */
@Entity
@Table(name = "shops")
@Getter
@Setter
public class Shop {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	// Vendor account
	private String ownerName;
	private String email;
	private String passwordHash;

	// Shop profile
	private String shopName;
	private String phone;
	private String alternatePhone;
	private String category = "Grocery";
	private String description;
	private String address;
	private double latitude;
	private double longitude;
	private String openingHours = "9:00 AM - 9:00 PM";

	@Column(name = "is_open")
	private boolean open = true;

	// Delivery is the shop's decision
	private boolean homeDelivery;
	private double deliveryRadiusKm = 2;

	@Column(precision = 10, scale = 2)
	private BigDecimal minOrderAmount = BigDecimal.ZERO;

	@Column(precision = 10, scale = 2)
	private BigDecimal deliveryCharge = BigDecimal.ZERO;

	@CreationTimestamp
	private Instant createdAt;

	@UpdateTimestamp
	private Instant updatedAt;

	public double distanceKmFrom(double lat, double lng) {
		return com.localkart.common.Geo.haversineKm(lat, lng, latitude, longitude);
	}

	public boolean deliversWithin(double distanceKm) {
		return homeDelivery && distanceKm <= deliveryRadiusKm;
	}
}
