package com.localkart.admin;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.common.ApiException;
import com.localkart.shop.Shop;
import com.localkart.shop.ShopRepository;
import com.localkart.shop.ShopStatus;

/** Shop review and moderation by LocalKart staff. */
@Service
public class AdminShopService {

	public record PageResult<T>(List<T> items, int page, int size, long total, int totalPages) {
		static <T> PageResult<T> of(Page<?> p, List<T> items) {
			return new PageResult<>(items, p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
		}
	}

	private final ShopRepository shops;
	private final AuditService audit;
	private final JdbcTemplate jdbc;
	private final NamedParameterJdbcTemplate named;

	public AdminShopService(ShopRepository shops, AuditService audit, JdbcTemplate jdbc) {
		this.shops = shops;
		this.audit = audit;
		this.jdbc = jdbc;
		this.named = new NamedParameterJdbcTemplate(jdbc);
	}

	@Transactional(readOnly = true)
	public PageResult<AdminShopView> list(ShopStatus status, String q, int page, int size) {
		String pattern = "%" + (q == null ? "" : q.trim().toLowerCase().replace("!", "!!").replace("%", "!%").replace("_", "!_")) + "%";
		PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
		Page<Shop> result = status == null ? shops.search(pattern, pr) : shops.searchByStatus(status, pattern, pr);
		Map<UUID, Long> counts = productCounts(result.getContent().stream().map(Shop::getId).toList());
		return PageResult.of(result, result.getContent().stream()
				.map(s -> AdminShopView.of(s, counts.getOrDefault(s.getId(), 0L), null, null)).toList());
	}

	@Transactional(readOnly = true)
	public AdminShopView detail(UUID id) {
		Shop s = get(id);
		Long total = jdbc.queryForObject("select count(*) from products where shop_id = ?", Long.class, id);
		Long inStock = jdbc.queryForObject("select count(*) from products where shop_id = ? and in_stock", Long.class, id);
		Map<String, Long> byType = new HashMap<>();
		jdbc.query("select type, count(*) from shop_events where shop_id = ? and created_at >= ? group by type",
				rs -> { byType.put(rs.getString(1), rs.getLong(2)); }, id,
				java.sql.Timestamp.from(Instant.now().minus(30, ChronoUnit.DAYS)));
		var activity = new AdminShopView.Activity(byType.getOrDefault("VIEW", 0L), byType.getOrDefault("CALL", 0L),
				byType.getOrDefault("WHATSAPP", 0L), byType.getOrDefault("DIRECTIONS", 0L), byType.getOrDefault("ORDER", 0L));
		return AdminShopView.of(s, total == null ? 0 : total, inStock, activity);
	}

	@Transactional
	public AdminShopView approve(UUID id, String note, Admin by) {
		Shop s = get(id);
		if (s.getStatus() != ShopStatus.PENDING && s.getStatus() != ShopStatus.REJECTED) {
			throw ApiException.badRequest(s.getStatus() == ShopStatus.SUSPENDED ? "This shop is suspended: use Reinstate"
					: "This shop is already approved");
		}
		return transition(s, ShopStatus.APPROVED, note, by, "SHOP_APPROVED");
	}

	@Transactional
	public AdminShopView reject(UUID id, String reason, Admin by) {
		Shop s = get(id);
		if (s.getStatus() != ShopStatus.PENDING) {
			throw ApiException.badRequest("Only shops waiting for review can be rejected (use Suspend for live shops)");
		}
		return transition(s, ShopStatus.REJECTED, requireReason(reason, "rejecting"), by, "SHOP_REJECTED");
	}

	@Transactional
	public AdminShopView suspend(UUID id, String reason, Admin by) {
		Shop s = get(id);
		if (s.getStatus() != ShopStatus.APPROVED) {
			throw ApiException.badRequest("Only live (approved) shops can be suspended");
		}
		return transition(s, ShopStatus.SUSPENDED, requireReason(reason, "suspending"), by, "SHOP_SUSPENDED");
	}

	@Transactional
	public AdminShopView reinstate(UUID id, String note, Admin by) {
		Shop s = get(id);
		if (s.getStatus() != ShopStatus.SUSPENDED) {
			throw ApiException.badRequest("Only suspended shops can be reinstated");
		}
		return transition(s, ShopStatus.APPROVED, note, by, "SHOP_REINSTATED");
	}

	private AdminShopView transition(Shop s, ShopStatus to, String note, Admin by, String action) {
		ShopStatus from = s.getStatus();
		s.setStatus(to);
		s.setReviewNote(note);
		s.setReviewedAt(Instant.now());
		s.setReviewedBy(by.getEmail());
		shops.saveAndFlush(s);
		audit.log(by, action, "SHOP", s.getId(), s.getShopName(), from + " -> " + to + (note == null ? "" : ": " + note));
		return detail(s.getId());
	}

	private static String requireReason(String reason, String what) {
		if (reason == null || reason.trim().length() < 5) {
			throw ApiException.badRequest("Give the shop owner a reason for " + what + " (at least 5 characters)");
		}
		return reason.trim();
	}

	private Shop get(UUID id) {
		return shops.findById(id).orElseThrow(() -> ApiException.notFound("Shop not found"));
	}

	private Map<UUID, Long> productCounts(List<UUID> ids) {
		Map<UUID, Long> counts = new HashMap<>();
		if (ids.isEmpty()) return counts;
		named.query("select shop_id, count(*) from products where shop_id in (:ids) group by shop_id",
				new MapSqlParameterSource("ids", ids), rs -> { counts.put(rs.getObject(1, UUID.class), rs.getLong(2)); });
		return counts;
	}
}
