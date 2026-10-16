package com.localkart.insights;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.common.ApiException;
import com.localkart.config.AppProperties;
import com.localkart.shop.ShopRepository;

@Service
public class InsightsService {

	public static final Set<Integer> ALLOWED_DAYS = Set.of(7, 30, 90);
	// Shops are in India, so "a day" for the dashboard is an IST calendar day.
	static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

	private final ShopEventRepository events;
	private final ShopRepository shops;
	private final JdbcTemplate jdbc;
	private final byte[] salt;
	private final Clock clock;

	public InsightsService(ShopEventRepository events, ShopRepository shops, JdbcTemplate jdbc, AppProperties props,
			Clock clock) {
		this.events = events;
		this.shops = shops;
		this.jdbc = jdbc;
		this.salt = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
		this.clock = clock;
	}

	/**
	 * Records a customer action. Returns false when it was a repeat inside the event type's dedupe window
	 * (the request still succeeds, it just isn't counted twice).
	 */
	@Transactional
	public boolean record(UUID shopId, EventRequest req, String fallbackClientKey) {
		if (!shops.existsById(shopId)) {
			throw ApiException.notFound("Shop not found");
		}
		EventType type = EventType.valueOf(req.type().toUpperCase(Locale.ROOT));
		EventSource source = req.source() == null ? EventSource.WEB : EventSource.valueOf(req.source().toUpperCase(Locale.ROOT));
		String visitor = hash(req.visitorId() != null ? "v:" + req.visitorId() : "c:" + fallbackClientKey);

		// Serialise concurrent requests for the same visitor/shop/type (e.g. a double-fired tap), so the
		// check-then-insert below can't let both through. Lock is released when the transaction ends.
		jdbc.query("select pg_advisory_xact_lock(hashtext(?))", rs -> {}, shopId + "|" + visitor + "|" + type);

		Instant since = clock.instant().minus(type.dedupeWindow());
		if (events.existsByShopIdAndVisitorHashAndTypeAndCreatedAtAfter(shopId, visitor, type, since)) {
			return false;
		}
		ShopEvent e = new ShopEvent();
		e.setShopId(shopId);
		e.setType(type);
		e.setSource(source);
		e.setVisitorHash(visitor);
		events.save(e);
		return true;
	}

	@Transactional(readOnly = true)
	public Insights forShop(UUID shopId, int days) {
		if (!ALLOWED_DAYS.contains(days)) {
			throw ApiException.badRequest("days must be 7, 30 or 90");
		}
		LocalDate today = LocalDate.now(clock.withZone(ZONE));
		LocalDate from = today.minusDays(days - 1L);
		Instant start = from.atStartOfDay(ZONE).toInstant();
		Instant end = today.plusDays(1).atStartOfDay(ZONE).toInstant();
		Instant previousStart = from.minusDays(days).atStartOfDay(ZONE).toInstant();

		Map<LocalDate, Map<EventType, Long>> byDay = new HashMap<>();
		for (var row : events.countByDay(shopId, start, end, ZONE.getId())) {
			byDay.computeIfAbsent(row.getDay(), d -> new EnumMap<>(EventType.class))
					.merge(EventType.valueOf(row.getType()), row.getTotal(), Long::sum);
		}
		List<Insights.Day> daily = new ArrayList<>(days);
		Map<EventType, Long> sum = new EnumMap<>(EventType.class);
		for (LocalDate d = from; !d.isAfter(today); d = d.plusDays(1)) {
			Map<EventType, Long> c = byDay.getOrDefault(d, Map.of());
			c.forEach((t, n) -> sum.merge(t, n, Long::sum));
			daily.add(new Insights.Day(d, n(c, EventType.VIEW), n(c, EventType.CALL), n(c, EventType.WHATSAPP),
					n(c, EventType.DIRECTIONS)));
		}

		Map<EventType, Long> prev = new EnumMap<>(EventType.class);
		for (var row : events.countByDay(shopId, previousStart, start, ZONE.getId())) {
			prev.merge(EventType.valueOf(row.getType()), row.getTotal(), Long::sum);
		}

		Map<String, Long> sources = new LinkedHashMap<>();
		for (EventSource s : EventSource.values()) {
			sources.put(s.name().toLowerCase(Locale.ROOT), 0L);
		}
		for (var row : events.countBySource(shopId, start, end)) {
			sources.put(row.getSource().toLowerCase(Locale.ROOT), row.getTotal());
		}

		return new Insights(days, from, today, ZONE.getId(), totals(sum), totals(prev), daily, sources);
	}

	private static long n(Map<EventType, Long> counts, EventType t) {
		return counts.getOrDefault(t, 0L);
	}

	private static Insights.Totals totals(Map<EventType, Long> c) {
		return new Insights.Totals(n(c, EventType.VIEW), n(c, EventType.CALL), n(c, EventType.WHATSAPP),
				n(c, EventType.DIRECTIONS));
	}

	private String hash(String value) {
		try {
			MessageDigest sha = MessageDigest.getInstance("SHA-256");
			sha.update(salt);
			return HexFormat.of().formatHex(sha.digest(value.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}
}
