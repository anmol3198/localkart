package com.localkart.auth;

import com.localkart.shop.ShopRequest;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Vendor account details plus the initial shop profile. */
@Getter
@Setter
public class RegisterRequest extends ShopRequest {

	@NotBlank(message = "Owner name is required")
	@Size(max = 120, message = "Owner name is too long")
	private String ownerName;

	@NotBlank(message = "Email is required")
	@Email(message = "Enter a valid email")
	private String email;

	@NotBlank(message = "Password is required")
	@Size(min = 6, max = 72, message = "Password must be 6-72 characters")
	private String password;
}
