package com.localkart.common;

/** Small geo helpers; accurate enough for city-scale distances. */
public final class Geo {

	private static final double EARTH_RADIUS_KM = 6371.0;
	private static final double KM_PER_DEGREE_LAT = 110.574;
	private static final double KM_PER_DEGREE_LNG_AT_EQUATOR = 111.320;

	private Geo() {
	}

	public static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
		double dLat = Math.toRadians(lat2 - lat1);
		double dLng = Math.toRadians(lng2 - lng1);
		double h = Math.pow(Math.sin(dLat / 2), 2)
				+ Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
		return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
	}

	/** Lat/lng box that fully contains a circle of {@code radiusKm}, used to prefilter with an index. */
	public static BoundingBox boundingBox(double lat, double lng, double radiusKm) {
		double padded = radiusKm * 1.01;
		double dLat = padded / KM_PER_DEGREE_LAT;
		double cosLat = Math.max(Math.cos(Math.toRadians(lat)), 0.01);
		double dLng = padded / (KM_PER_DEGREE_LNG_AT_EQUATOR * cosLat);
		return new BoundingBox(lat - dLat, lat + dLat, lng - dLng, lng + dLng);
	}

	public static boolean isValid(Double lat, Double lng) {
		return lat != null && lng != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
	}

	public static double round2(double value) {
		return Math.round(value * 100) / 100.0;
	}

	public record BoundingBox(double minLat, double maxLat, double minLng, double maxLng) {
	}
}
