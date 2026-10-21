package com.localkart.admin;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.localkart.shop.Shop;
import com.localkart.shop.ShopStatus;

/** What staff see about a shop (includes owner contact details; never exposed to customers). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminShopView(
		UUID id, String shopName, String ownerName, String email, String phone, String alternatePhone, String category,
		String address, String description, double lat, double lng, String openingHours, boolean homeDelivery,
		ShopStatus status, String reviewNote, Instant reviewedAt, String reviewedBy, Instant submittedAt,
		Instant createdAt, Instant updatedAt, long products, Long inStock, Activity activity30d) {

	public record Activity(long views, long calls, long whatsapp, long directions) {
	}

	static AdminShopView of(Shop s, long products, Long inStock, Activity activity) {
		return new AdminShopView(s.getId(), s.getShopName(), s.getOwnerName(), s.getEmail(), s.getPhone(), s.getAlternatePhone(),
				s.getCategory(), s.getAddress(), s.getDescription(), s.getLatitude(), s.getLongitude(), s.getOpeningHours(),
				s.isHomeDelivery(), s.getStatus(), s.getReviewNote(), s.getReviewedAt(), s.getReviewedBy(), s.getSubmittedAt(),
				s.getCreatedAt(), s.getUpdatedAt(), products, inStock, activity);
	}
}
