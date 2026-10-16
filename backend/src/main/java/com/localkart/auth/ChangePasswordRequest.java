package com.localkart.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ChangePasswordRequest(
		@NotBlank(message = "Enter your current password") String currentPassword,
		@NotBlank(message = "Enter a new password")
		@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)\\S.{6,70}\\S$", message = "Password must be 8-72 characters with at least one letter and one number") String newPassword) {
}
