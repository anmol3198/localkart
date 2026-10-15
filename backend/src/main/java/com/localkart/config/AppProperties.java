package com.localkart.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("localkart")
public record AppProperties(double maxSearchRadiusKm, String corsOrigin, Jwt jwt, Seed seed) {

	public record Jwt(String secret, Duration ttl) {
	}

	public record Seed(boolean enabled, double lat, double lng) {
	}
}
