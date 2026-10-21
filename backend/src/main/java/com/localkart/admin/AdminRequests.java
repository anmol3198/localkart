package com.localkart.admin;

import com.localkart.auth.RegisterRequest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request bodies for the admin area. */
public final class AdminRequests {

	private AdminRequests() {
	}

	public record Login(
			@NotBlank(message = "Enter your email") String email,
			@NotBlank(message = "Enter your password") String password) {
	}

	/** Reason shown to the shop owner. Required for reject and suspend, optional for approve/reinstate. */
	public record Review(@Size(max = 500, message = "Keep the note under 500 characters") String reason) {
		public String trimmed() {
			return reason == null || reason.isBlank() ? null : reason.trim();
		}
	}

	public record CreateAdmin(
			@NotBlank(message = "Name is required")
			@Pattern(regexp = "^(?=.*\\p{L})[\\p{L}\\p{M} .'-]{2,80}$", message = "Enter a name using letters (2-80 characters)") String name,
			@NotBlank(message = "Email is required")
			@Size(max = 254, message = "Email is too long")
			@Pattern(regexp = RegisterRequest.EMAIL, message = "Enter a valid email, like name@gmail.com") String email,
			@NotBlank(message = "Password is required")
			@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)\\S.{8,70}\\S$", message = "Admin passwords must be 10-72 characters with letters and numbers") String password,
			@NotBlank(message = "Role is required")
			@Pattern(regexp = "ADMIN|SUPER_ADMIN", message = "Role must be ADMIN or SUPER_ADMIN") String role) {
	}

	public record SetActive(boolean active) {
	}

	public record ChangePassword(
			@NotBlank(message = "Enter your current password") String currentPassword,
			@NotBlank(message = "Enter a new password")
			@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)\\S.{8,70}\\S$", message = "Admin passwords must be 10-72 characters with letters and numbers") String newPassword) {
	}
}
