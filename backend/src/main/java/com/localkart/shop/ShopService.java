package com.localkart.shop;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.common.ApiException;
import com.localkart.common.Geo;
import com.localkart.common.ShopCategories;
import com.localkart.config.AppProperties;
import com.localkart.product.Product;
import com.localkart.product.ProductRepository;
import com.localkart.product.ProductView;

@Service
public class ShopService {

	private static final int MAX_RESULTS = 200;
	private static final int MAX_MATCHES_PER_SHOP = 5;

	private final ShopRepository shops;
	private final ProductRepository products;
	private final AppProperties props;

	public ShopService(ShopRepository shops, ProductRepository products, AppProperties props) {
		this.shops = shops;
		this.products = products;
		this.props = props;
	}

	public record NearbyResult(double radiusKm, int count, List<ShopView> shops) {
	}

	public record ShopDetail(ShopView shop, List<ProductView> products) {
	}

	/**
	 * Shops within {@code radiusKm} (capped at the configured max), nearest first. {@code q} matches the
	 * shop name or any product name in the shop's inventory.
	 */
	@Transactional(readOnly = true)
	public NearbyResult nearby(Double lat, Double lng, Double radiusKm, String q, String category, boolean deliveryOnly) {
		if (!Geo.isValid(lat, lng)) {
			throw ApiException.badRequest("Valid lat and lng are required");
		}
		double max = props.maxSearchRadiusKm();
		double radius = radiusKm == null || radiusKm <= 0 ? max : Math.min(radiusKm, max);

		var box = Geo.boundingBox(lat, lng, radius);
		record Candidate(Shop shop, double distanceKm) {
		}
		List<Candidate> inRange = shops
				.findByLatitudeBetweenAndLongitudeBetweenAndStatus(box.minLat(), box.maxLat(), box.minLng(), box.maxLng(), ShopStatus.APPROVED)
				.stream()
				.filter(s -> category == null || category.isBlank() || category.equals(s.getCategory()))
				.filter(s -> !deliveryOnly || s.isHomeDelivery())
				.map(s -> new Candidate(s, s.distanceKmFrom(lat, lng)))
				.filter(c -> c.distanceKm() <= radius)
				.sorted(Comparator.comparingDouble(Candidate::distanceKm))
				.limit(MAX_RESULTS)
				.toList();

		String query = q == null ? "" : q.trim();
		Map<UUID, List<ProductView>> matches = query.isEmpty() || inRange.isEmpty() ? Map.of()
				: products.searchInShops(inRange.stream().map(c -> c.shop().getId()).toList(), likePattern(query))
						.stream()
						.collect(Collectors.groupingBy(Product::getShopId,
								Collectors.collectingAndThen(Collectors.toList(),
										list -> list.stream().limit(MAX_MATCHES_PER_SHOP).map(ProductView::of).toList())));

		String needle = query.toLowerCase(Locale.ROOT);
		List<ShopView> result = inRange.stream()
				.filter(c -> query.isEmpty() || matches.containsKey(c.shop().getId())
						|| c.shop().getShopName().toLowerCase(Locale.ROOT).contains(needle))
				.map(c -> ShopView.forCustomerAt(c.shop(), lat, lng,
						query.isEmpty() ? null : matches.getOrDefault(c.shop().getId(), List.of())))
				.toList();
		return new NearbyResult(radius, result.size(), result);
	}

	@Transactional(readOnly = true)
	public ShopDetail detail(UUID id, Double lat, Double lng) {
		// Shops waiting for review, rejected or suspended look like they don't exist to customers.
		Shop shop = shops.findByIdAndStatus(id, ShopStatus.APPROVED).orElseThrow(() -> ApiException.notFound("Shop not found"));
		ShopView view = Geo.isValid(lat, lng) ? ShopView.forCustomerAt(shop, lat, lng, null) : ShopView.forPublic(shop);
		List<ProductView> inventory = products.findByShopIdOrderByInStockDescCategoryAscNameAsc(id).stream()
				.map(ProductView::of)
				.toList();
		return new ShopDetail(view, inventory);
	}

	@Transactional(readOnly = true)
	public Shop get(UUID id) {
		return shops.findById(id).orElseThrow(() -> ApiException.notFound("Shop not found"));
	}

	@Transactional
	public Shop update(UUID id, ShopRequest req) {
		Shop shop = get(id);
		requireNotSuspended(shop);
		apply(req, shop);
		return shops.saveAndFlush(shop);
	}

	/** After a rejection the owner fixes the details and sends the shop back for review. */
	@Transactional
	public Shop resubmit(UUID id) {
		Shop shop = get(id);
		requireNotSuspended(shop);
		if (shop.getStatus() != ShopStatus.REJECTED) {
			throw ApiException.badRequest(shop.getStatus() == ShopStatus.PENDING ? "Your shop is already waiting for review"
					: "Only a rejected shop can be sent for review again");
		}
		shop.setStatus(ShopStatus.PENDING);
		shop.setSubmittedAt(java.time.Instant.now());
		return shops.saveAndFlush(shop);
	}

	/** Suspended shops can log in and see why, but can't change anything. */
	public static void requireNotSuspended(Shop shop) {
		if (shop.getStatus() == ShopStatus.SUSPENDED) {
			throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
					"Your shop is suspended, so changes are paused. Contact LocalKart support to sort it out.");
		}
	}

	/** Copies the non-null fields of {@code req} onto {@code shop}. */
	public static void apply(ShopRequest req, Shop shop) {
		if (req.getCategory() != null && !ShopCategories.ALL.contains(req.getCategory())) {
			throw ApiException.badRequest("Invalid category");
		}
		if ((req.getLat() == null) != (req.getLng() == null)) {
			throw ApiException.badRequest("Both lat and lng are required to change location");
		}
		if (req.getShopName() != null) shop.setShopName(req.getShopName().trim());
		if (req.getPhone() != null) shop.setPhone(req.getPhone().trim());
		if (req.getAlternatePhone() != null) shop.setAlternatePhone(blankToNull(req.getAlternatePhone()));
		if (req.getCategory() != null) shop.setCategory(req.getCategory());
		if (req.getDescription() != null) shop.setDescription(blankToNull(req.getDescription()));
		if (req.getAddress() != null) shop.setAddress(req.getAddress().trim());
		if (req.getOpeningHours() != null) shop.setOpeningHours(req.getOpeningHours().trim());
		if (req.getIsOpen() != null) shop.setOpen(req.getIsOpen());
		if (req.getHomeDelivery() != null) shop.setHomeDelivery(req.getHomeDelivery());
		if (req.getDeliveryRadiusKm() != null) shop.setDeliveryRadiusKm(req.getDeliveryRadiusKm());
		if (req.getMinOrderAmount() != null) shop.setMinOrderAmount(req.getMinOrderAmount());
		if (req.getDeliveryCharge() != null) shop.setDeliveryCharge(req.getDeliveryCharge());
		if (req.getLat() != null) {
			shop.setLatitude(req.getLat());
			shop.setLongitude(req.getLng());
		}
		if (shop.getAlternatePhone() != null && shop.getAlternatePhone().equals(shop.getPhone())) {
			throw ApiException.badRequest("Alternate phone must be different from the main phone");
		}
	}

	private static String blankToNull(String s) {
		return s.isBlank() ? null : s.trim();
	}

	/** Case-insensitive "contains" LIKE pattern, with wildcards in the user's text escaped using '!'. */
	private static String likePattern(String q) {
		String escaped = q.toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_");
		return "%" + escaped + "%";
	}
}
