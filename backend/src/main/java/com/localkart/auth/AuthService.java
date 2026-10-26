package com.localkart.auth;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.common.ApiException;
import com.localkart.shop.Shop;
import com.localkart.shop.ShopRepository;
import com.localkart.shop.ShopService;
import com.localkart.shop.ShopView;

@Service
public class AuthService {

	private final ShopRepository shops;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokens;
	private final LoginAttemptLimiter attempts;
	// Compared against when the email doesn't exist, so response time doesn't reveal which emails are registered.
	private final String dummyHash;

	public AuthService(ShopRepository shops, PasswordEncoder passwordEncoder, TokenService tokens, LoginAttemptLimiter attempts) {
		this.shops = shops;
		this.passwordEncoder = passwordEncoder;
		this.tokens = tokens;
		this.attempts = attempts;
		this.dummyHash = passwordEncoder.encode("not-a-real-password-0");
	}

	@Transactional
	public AuthResponse register(RegisterRequest req) {
		String email = normalize(req.getEmail());
		if (shops.existsByEmail(email)) {
			throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
		}
		Shop shop = new Shop();
		shop.setOwnerName(req.getOwnerName().trim());
		shop.setEmail(email);
		shop.setPasswordHash(passwordEncoder.encode(req.getPassword()));
		ShopService.apply(req, shop);
		// New shops wait for LocalKart staff to check them before customers can see them.
		shop.setStatus(com.localkart.shop.ShopStatus.PENDING);
		shop.setSubmittedAt(java.time.Instant.now());
		shop.setTermsAcceptedAt(shop.getSubmittedAt());
		shop.setTermsVersion(Legal.TERMS_VERSION);
		shop = shops.saveAndFlush(shop);
		return new AuthResponse(tokens.issue(shop), ShopView.forOwner(shop));
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest req) {
		String email = normalize(req.email());
		attempts.check(email);
		Shop shop = shops.findByEmail(email).orElse(null);
		boolean ok = passwordEncoder.matches(req.password(), shop != null ? shop.getPasswordHash() : dummyHash);
		if (shop == null || !ok) {
			attempts.recordFailure(email);
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		attempts.recordSuccess(email);
		return new AuthResponse(tokens.issue(shop), ShopView.forOwner(shop));
	}

	/** Signs out every device (all older tokens stop working); the caller gets a fresh token. */
	@Transactional
	public AuthResponse logoutEverywhere(java.util.UUID shopId) {
		Shop shop = shops.findById(shopId).orElseThrow(() -> ApiException.notFound("Shop not found"));
		shop.setTokenVersion(shop.getTokenVersion() + 1);
		shop = shops.saveAndFlush(shop);
		return new AuthResponse(tokens.issue(shop), ShopView.forOwner(shop));
	}

	/** Changes the password and signs out all other devices. */
	@Transactional
	public AuthResponse changePassword(java.util.UUID shopId, ChangePasswordRequest req) {
		Shop shop = shops.findById(shopId).orElseThrow(() -> ApiException.notFound("Shop not found"));
		attempts.check(shop.getEmail());
		if (!passwordEncoder.matches(req.currentPassword(), shop.getPasswordHash())) {
			attempts.recordFailure(shop.getEmail());
			throw ApiException.badRequest("Current password is incorrect");
		}
		if (req.currentPassword().equals(req.newPassword())) {
			throw ApiException.badRequest("New password must be different from the current one");
		}
		attempts.recordSuccess(shop.getEmail());
		shop.setPasswordHash(passwordEncoder.encode(req.newPassword()));
		shop.setTokenVersion(shop.getTokenVersion() + 1);
		shop = shops.saveAndFlush(shop);
		return new AuthResponse(tokens.issue(shop), ShopView.forOwner(shop));
	}

	/** Permanently deletes the shop, its items and its activity. Needs the password, so a stolen session alone can't do it. */
	@Transactional
	public void deleteAccount(java.util.UUID shopId, DeleteAccountRequest req) {
		Shop shop = shops.findById(shopId).orElseThrow(() -> ApiException.notFound("Shop not found"));
		attempts.check(shop.getEmail());
		if (!passwordEncoder.matches(req.password(), shop.getPasswordHash())) {
			attempts.recordFailure(shop.getEmail());
			throw ApiException.badRequest("Password is incorrect");
		}
		attempts.recordSuccess(shop.getEmail());
		// Items and activity events go with it (ON DELETE CASCADE); every login token stops working.
		shops.delete(shop);
	}

	private static String normalize(String email) {
		return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
	}
}
