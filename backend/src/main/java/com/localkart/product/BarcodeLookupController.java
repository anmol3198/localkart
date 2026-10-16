package com.localkart.product;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Vendor-only (under /api/vendor), so the lookup isn't an open proxy. */
@RestController
public class BarcodeLookupController {

	private final BarcodeLookupService lookup;

	public BarcodeLookupController(BarcodeLookupService lookup) {
		this.lookup = lookup;
	}

	@GetMapping("/api/vendor/barcode-lookup/{code}")
	public BarcodeLookupService.Suggestion lookup(@PathVariable String code) {
		return lookup.lookup(code);
	}
}
