package com.localkart.product;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.localkart.common.ApiException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Suggests a name for a scanned retail barcode using Open Food Facts (free, no key). Coverage of Indian
 * brands is partial, so "not found" is normal and the owner just types the name once.
 */
@Service
public class BarcodeLookupService {

	public record Suggestion(String barcode, String name, String brand, String quantity, String section) {
	}

	private static final Logger log = LoggerFactory.getLogger(BarcodeLookupService.class);
	private static final int CACHE_SIZE = 2000;
	// Open Food Facts category tags -> a sensible shop section
	private static final List<Map.Entry<String, String>> SECTIONS = List.of(
			Map.entry("dair", "Dairy"), Map.entry("milk", "Dairy"), Map.entry("cheese", "Dairy"),
			Map.entry("noodle", "Snacks"), Map.entry("snack", "Snacks"), Map.entry("biscuit", "Snacks"),
			Map.entry("chip", "Snacks"), Map.entry("chocolate", "Snacks"), Map.entry("confection", "Snacks"),
			Map.entry("beverage", "Beverages"), Map.entry("drink", "Beverages"), Map.entry("tea", "Beverages"),
			Map.entry("coffee", "Beverages"), Map.entry("bread", "Bakery"), Map.entry("cereal", "Staples"),
			Map.entry("rice", "Staples"), Map.entry("flour", "Staples"), Map.entry("pulse", "Staples"),
			Map.entry("oil", "Oil"), Map.entry("spice", "Spices"), Map.entry("sauce", "Sauces"),
			Map.entry("personal-care", "Personal Care"), Map.entry("hygiene", "Personal Care"));

	private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
	private final JsonMapper json;
	private final boolean enabled;
	private final String baseUrl;
	private final Map<String, Optional<Suggestion>> cache = Collections.synchronizedMap(
			new LinkedHashMap<>(256, 0.75f, true) {
				@Override
				protected boolean removeEldestEntry(Map.Entry<String, Optional<Suggestion>> eldest) {
					return size() > CACHE_SIZE;
				}
			});

	public BarcodeLookupService(JsonMapper json,
			@Value("${localkart.barcode-lookup.enabled:true}") boolean enabled,
			@Value("${localkart.barcode-lookup.url:https://world.openfoodfacts.org}") String baseUrl) {
		this.json = json;
		this.enabled = enabled;
		this.baseUrl = baseUrl;
	}

	public Suggestion lookup(String raw) {
		String code = Barcodes.validated(raw);
		if (!Barcodes.isGtin(code)) {
			throw ApiException.notFound("Only product barcodes (8-14 digits) can be looked up. Type the item name instead");
		}
		Optional<Suggestion> hit = cache.get(code);
		if (hit == null) {
			hit = fetch(code);
			cache.put(code, hit);
		}
		return hit.orElseThrow(() -> ApiException.notFound("We don't know this product yet. Type its name once and it's saved for next time"));
	}

	private Optional<Suggestion> fetch(String code) {
		if (!enabled) {
			return Optional.empty();
		}
		try {
			HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "/api/v2/product/" + code
					+ ".json?fields=product_name,product_name_en,brands,quantity,categories_tags"))
					.timeout(Duration.ofSeconds(4))
					.header("User-Agent", "LocalKart/1.0 (local shop inventory)")
					.GET().build();
			HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
			if (res.statusCode() != 200) {
				return Optional.empty();
			}
			JsonNode p = json.readTree(res.body()).path("product");
			String name = firstNonBlank(p.path("product_name_en").asString(""), p.path("product_name").asString(""));
			if (name.isBlank()) {
				return Optional.empty();
			}
			String brand = p.path("brands").asString("").split(",")[0].trim();
			String fullName = !brand.isEmpty() && !name.toLowerCase().contains(brand.toLowerCase()) ? brand + " " + name : name;
			return Optional.of(new Suggestion(code, truncate(fullName.trim(), 150), brand.isEmpty() ? null : brand,
					blankToNull(cleanQuantity(p.path("quantity").asString(""))), section(p.path("categories_tags"))));
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			return Optional.empty();
		} catch (Exception e) {
			// Lookup is a convenience: on any network/parse problem the owner simply types the name.
			log.debug("Barcode lookup failed for {}: {}", code, e.toString());
			return Optional.empty();
		}
	}

	/** Tags run from general to specific, so check the most specific first and skip catch-all groups. */
	private static String section(JsonNode tags) {
		List<String> list = new java.util.ArrayList<>();
		tags.forEach(t -> list.add(t.asString("").toLowerCase()));
		Collections.reverse(list);
		for (String tag : list) {
			if (tag.contains("-and-")) continue; // e.g. "plant-based-foods-and-beverages"
			for (var e : SECTIONS) {
				if (tag.contains(e.getKey())) return e.getValue();
			}
		}
		return null;
	}

	/** "400 g e" / "400 g ℮" -> "400 g" (the e-mark only means the weight is an estimate). */
	static String cleanQuantity(String q) {
		return q == null ? null : q.replaceAll("\\s*[e\u212E]$", "").trim();
	}

	private static String firstNonBlank(String a, String b) {
		return a.isBlank() ? b : a;
	}

	private static String blankToNull(String s) {
		return s == null || s.isBlank() ? null : s.trim();
	}

	private static String truncate(String s, int max) {
		return s.length() <= max ? s : s.substring(0, max);
	}
}
