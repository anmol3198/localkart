package com.localkart.product;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.localkart.common.OnCreate;

import jakarta.validation.Valid;
import jakarta.validation.groups.Default;

/** Inventory management for the logged-in vendor's shop. */
@RestController
@RequestMapping("/api/vendor/products")
public class VendorProductController {

	private final ProductService productService;

	public VendorProductController(ProductService productService) {
		this.productService = productService;
	}

	@GetMapping
	public List<ProductView> list(@AuthenticationPrincipal Jwt jwt) {
		return productService.list(shopId(jwt)).stream().map(ProductView::of).toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ProductView create(@AuthenticationPrincipal Jwt jwt,
			@Validated({ OnCreate.class, Default.class }) @RequestBody ProductRequest req) {
		return ProductView.of(productService.create(shopId(jwt), req));
	}

	@PutMapping("/{id}")
	public ProductView update(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
			@Valid @RequestBody ProductRequest req) {
		return ProductView.of(productService.update(shopId(jwt), id, req));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
		productService.delete(shopId(jwt), id);
	}

	private static UUID shopId(Jwt jwt) {
		return UUID.fromString(jwt.getSubject());
	}
}
