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

	public AuthService(ShopRepository shops, PasswordEncoder passwordEncoder, TokenService tokens) {
		this.shops = shops;
		this.passwordEncoder = passwordEncoder;
		this.tokens = tokens;
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
		shop = shops.saveAndFlush(shop);
		return new AuthResponse(tokens.issue(shop.getId()), ShopView.forOwner(shop));
	}

	@Transactional(readOnly = true)
	public AuthResponse login(LoginRequest req) {
		Shop shop = shops.findByEmail(normalize(req.email()))
				.filter(s -> req.password() != null && passwordEncoder.matches(req.password(), s.getPasswordHash()))
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
		return new AuthResponse(tokens.issue(shop.getId()), ShopView.forOwner(shop));
	}

	private static String normalize(String email) {
		return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
	}
}
