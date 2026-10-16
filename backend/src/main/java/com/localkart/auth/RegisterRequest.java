package com.localkart.auth;

import com.localkart.shop.ShopRequest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Vendor account details plus the initial shop profile. */
@Getter
@Setter
public class RegisterRequest extends ShopRequest {

	@NotBlank(message = "Owner name is required")
	// \p{M}: vowel signs in Indian scripts (e.g. प्रिया) are "marks", not letters
	@Pattern(regexp = "^(?=.*\\p{L})[\\p{L}\\p{M} .'-]{2,80}$", message = "Enter your name using letters (2-80 characters)")
	private String ownerName;

	@NotBlank(message = "Email is required")
	@Size(max = 254, message = "Email is too long")
	@Pattern(regexp = EMAIL, message = "Enter a valid email, like name@gmail.com")
	private String email;

	@NotBlank(message = "Password is required")
	@Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)\\S.{6,70}\\S$", message = "Password must be 8-72 characters with at least one letter and one number")
	private String password;

	/** Practical email check: no spaces, no double dots, a real-looking domain with a 2+ letter ending. */
	public static final String EMAIL = "^(?!.*\\.\\.)[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,24}$";

	public void setOwnerName(String ownerName) {
		this.ownerName = ownerName == null ? null : ownerName.trim().replaceAll("\\s+", " ");
	}

	public void setEmail(String email) {
		this.email = email == null ? null : email.trim().toLowerCase(java.util.Locale.ROOT);
	}
}
