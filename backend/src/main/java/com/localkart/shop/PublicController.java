package com.localkart.shop;

import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.localkart.common.ShopCategories;
import com.localkart.config.AppProperties;

/** Customer-facing endpoints; no login required. */
@RestController
@RequestMapping("/api")
public class PublicController {

	private final ShopService shopService;
	private final AppProperties props;

	public PublicController(ShopService shopService, AppProperties props) {
		this.shopService = shopService;
		this.props = props;
	}

	@GetMapping("/health")
	public Map<String, Boolean> health() {
		return Map.of("ok", true);
	}

	@GetMapping("/meta")
	public Map<String, Object> meta() {
		return Map.of("maxRadiusKm", props.maxSearchRadiusKm(), "categories", ShopCategories.ALL);
	}

	@GetMapping("/shops/nearby")
	public ShopService.NearbyResult nearby(
			@RequestParam(required = false) Double lat,
			@RequestParam(required = false) Double lng,
			@RequestParam(required = false) Double radiusKm,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) String category,
			@RequestParam(defaultValue = "false") boolean delivery) {
		return shopService.nearby(lat, lng, radiusKm, q, category, delivery);
	}

	@GetMapping("/shops/{id}")
	public ShopService.ShopDetail shop(
			@PathVariable UUID id,
			@RequestParam(required = false) Double lat,
			@RequestParam(required = false) Double lng) {
		return shopService.detail(id, lat, lng);
	}
}
