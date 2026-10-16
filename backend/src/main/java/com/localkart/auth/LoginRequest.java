package com.localkart.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
		@NotBlank(message = "Enter your email") String email,
		@NotBlank(message = "Enter your password") String password) {
}
