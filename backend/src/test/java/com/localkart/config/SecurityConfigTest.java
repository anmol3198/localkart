package com.localkart.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class SecurityConfigTest {

	@Test
	void refusesMissingShortOrPublicSecrets() {
		assertThrows(IllegalStateException.class, () -> SecurityConfig.checkSecret(null));
		assertThrows(IllegalStateException.class, () -> SecurityConfig.checkSecret("  "));
		assertThrows(IllegalStateException.class, () -> SecurityConfig.checkSecret("too-short"));
		assertThrows(IllegalStateException.class, () -> SecurityConfig.checkSecret("dev-only-secret-change-me-in-production!!"));
		assertDoesNotThrow(() -> SecurityConfig.checkSecret("Zq3v8M0y7c1H2kT9pW4sX6bN5rJ0aL8eQ1uF3gD7"));
	}
}
