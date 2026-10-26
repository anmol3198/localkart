package com.localkart.auth;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/** The logged-in vendor's account security. */
@RestController
public class AccountController {

	private final AuthService auth;

	public AccountController(AuthService auth) {
		this.auth = auth;
	}

	@PostMapping("/api/vendor/logout-all")
	public AuthResponse logoutAll(@AuthenticationPrincipal Jwt jwt) {
		return auth.logoutEverywhere(UUID.fromString(jwt.getSubject()));
	}

	@PutMapping("/api/vendor/password")
	public AuthResponse changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChangePasswordRequest req) {
		return auth.changePassword(UUID.fromString(jwt.getSubject()), req);
	}

	// POST rather than DELETE: some networks and clients drop DELETE request bodies.
	@PostMapping("/api/vendor/account/delete")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteAccount(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DeleteAccountRequest req) {
		auth.deleteAccount(UUID.fromString(jwt.getSubject()), req);
	}
}
