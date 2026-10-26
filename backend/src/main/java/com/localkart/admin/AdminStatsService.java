package com.localkart.admin;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** App-wide numbers for the Super Admin dashboard. */
@Service
public class AdminStatsService {

	static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
	private static final int DAYS = 30;

	public record Stats(Map<String, Long> shops, List<DayCount> newShops, List<NameCount> byCategory,
			Map<String, Long> products, Map<String, Long> activity30d, List<TopShop> topShops, long admins) {
	}

	public record DayCount(LocalDate date, long count) {
	}

	public record NameCount(String name, long count) {
	}

	public record TopShop(UUID id, String shopName, String category, long views, long contacts) {
	}

	private final JdbcTemplate jdbc;

	public AdminStatsService(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Transactional(readOnly = true)
	public Stats stats() {
		Map<String, Long> shops = new LinkedHashMap<>();
		for (String s : List.of("PENDING", "APPROVED", "REJECTED", "SUSPENDED")) shops.put(s.toLowerCase(), 0L);
		jdbc.query("select status, count(*) from shops group by status", rs -> { shops.put(rs.getString(1).toLowerCase(), rs.getLong(2)); });
		shops.put("total", shops.values().stream().mapToLong(Long::longValue).sum());

		LocalDate today = LocalDate.now(ZONE);
		LocalDate from = today.minusDays(DAYS - 1);
		Timestamp since = Timestamp.from(from.atStartOfDay(ZONE).toInstant());
		Map<LocalDate, Long> perDay = new HashMap<>();
		jdbc.query("select cast(created_at at time zone ? as date), count(*) from shops where created_at >= ? group by 1",
				rs -> { perDay.put(rs.getObject(1, LocalDate.class), rs.getLong(2)); }, ZONE.getId(), since);
		List<DayCount> newShops = new ArrayList<>();
		for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) newShops.add(new DayCount(d, perDay.getOrDefault(d, 0L)));

		List<NameCount> byCategory = jdbc.query(
				"select category, count(*) from shops where status = 'APPROVED' group by category order by 2 desc, 1",
				(rs, i) -> new NameCount(rs.getString(1), rs.getLong(2)));

		Map<String, Long> products = new LinkedHashMap<>();
		jdbc.query("select count(*), count(*) filter (where in_stock) from products",
				rs -> { products.put("total", rs.getLong(1)); products.put("inStock", rs.getLong(2)); });

		Timestamp last30 = Timestamp.from(Instant.now().minusSeconds(DAYS * 86400L));
		Map<String, Long> activity = new LinkedHashMap<>();
		for (String t : List.of("views", "calls", "whatsapp", "directions", "orders")) activity.put(t, 0L);
		jdbc.query("select type, count(*) from shop_events where created_at >= ? group by type", rs -> {
			String key = switch (rs.getString(1)) {
				case "VIEW" -> "views"; case "CALL" -> "calls"; case "WHATSAPP" -> "whatsapp"; case "ORDER" -> "orders"; default -> "directions";
			};
			activity.put(key, rs.getLong(2));
		}, last30);
		// Customers don't have accounts yet, so distinct devices are the best measure of reach.
		activity.put("uniqueVisitors", jdbc.queryForObject("select count(distinct visitor_hash) from shop_events where created_at >= ?", Long.class, last30));

		List<TopShop> top = jdbc.query("""
				select s.id, s.shop_name, s.category,
				       count(*) filter (where e.type = 'VIEW') as views,
				       count(*) filter (where e.type in ('CALL', 'WHATSAPP', 'ORDER')) as contacts
				from shop_events e join shops s on s.id = e.shop_id
				where e.created_at >= ?
				group by s.id, s.shop_name, s.category
				order by contacts desc, views desc
				limit 5""",
				(rs, i) -> new TopShop(rs.getObject(1, UUID.class), rs.getString(2), rs.getString(3), rs.getLong(4), rs.getLong(5)), last30);

		Long admins = jdbc.queryForObject("select count(*) from admins where active", Long.class);
		return new Stats(shops, newShops, byCategory, products, activity, top, admins == null ? 0 : admins);
	}
}
