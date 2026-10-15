package com.localkart.shop;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/** The logged-in vendor's own shop profile and delivery settings. */
@RestController
@RequestMapping("/api/vendor/shop")
public class VendorShopController {

	private final ShopService shopService;

	public VendorShopController(ShopService shopService) {
		this.shopService = shopService;
	}

	@GetMapping
	public ShopView get(@AuthenticationPrincipal Jwt jwt) {
		return ShopView.forOwner(shopService.get(UUID.fromString(jwt.getSubject())));
	}

	/** Partial update: only fields present in the body change (e.g. {"isOpen": false}). */
	@PutMapping
	public ShopView update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ShopRequest req) {
		return ShopView.forOwner(shopService.update(UUID.fromString(jwt.getSubject()), req));
	}
}
