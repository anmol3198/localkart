package com.localkart.shop;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.localkart.common.Geo;
import com.localkart.product.ProductView;

/**
 * Shop as returned by the API. Location is GeoJSON ({@code [lng, lat]}). Distance fields are only
 * present when the caller supplied their location.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ShopView(
		@JsonProperty("_id") UUID id,
		String ownerName,
		String email,
		String shopName,
		String phone,
		String alternatePhone,
		String category,
		String description,
		String address,
		GeoPoint location,
		String openingHours,
		@JsonProperty("isOpen") boolean isOpen,
		boolean homeDelivery,
		double deliveryRadiusKm,
		BigDecimal minOrderAmount,
		BigDecimal deliveryCharge,
		Instant createdAt,
		Instant updatedAt,
		Double distanceKm,
		Boolean deliversToYou,
		List<ProductView> matchingProducts) {

	public record GeoPoint(String type, double[] coordinates) {
		static GeoPoint of(double lat, double lng) {
			return new GeoPoint("Point", new double[] { lng, lat });
		}
	}

	/** Full view for the shop owner, including the login email. */
	public static ShopView forOwner(Shop s) {
		return build(s, s.getEmail(), null, null);
	}

	/** Public view; the vendor's email is never exposed to customers. */
	public static ShopView forPublic(Shop s) {
		return build(s, null, null, null);
	}

	public static ShopView forCustomerAt(Shop s, double lat, double lng, List<ProductView> matchingProducts) {
		return build(s, null, s.distanceKmFrom(lat, lng), matchingProducts);
	}

	private static ShopView build(Shop s, String email, Double distanceKm, List<ProductView> matching) {
		return new ShopView(s.getId(), s.getOwnerName(), email, s.getShopName(), s.getPhone(), s.getAlternatePhone(),
				s.getCategory(), s.getDescription(), s.getAddress(), GeoPoint.of(s.getLatitude(), s.getLongitude()),
				s.getOpeningHours(), s.isOpen(), s.isHomeDelivery(), s.getDeliveryRadiusKm(), s.getMinOrderAmount(),
				s.getDeliveryCharge(), s.getCreatedAt(), s.getUpdatedAt(),
				distanceKm == null ? null : Geo.round2(distanceKm),
				distanceKm == null ? null : s.deliversWithin(distanceKm),
				matching);
	}
}
