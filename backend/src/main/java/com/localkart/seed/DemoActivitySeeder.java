package com.localkart.seed;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gives the demo shops ~45 days of believable customer activity, so the Insights dashboard has something to
 * show. Runs once, only when no activity has been recorded yet, and only touches the demo accounts.
 */
@Component
@Order(2)
@ConditionalOnProperty(name = "localkart.seed.enabled", havingValue = "true")
public class DemoActivitySeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(DemoActivitySeeder.class);
	private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
	private static final int DAYS = 45;
	private static final String[] SOURCES = { "WEB", "WEB", "WEB", "WEB", "ANDROID", "ANDROID", "ANDROID", "IOS", "IOS", "WEB" };

	private final JdbcTemplate jdbc;
	private final Clock clock;

	public DemoActivitySeeder(JdbcTemplate jdbc, Clock clock) {
		this.jdbc = jdbc;
		this.clock = clock;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		Long existing = jdbc.queryForObject("select count(*) from shop_events", Long.class);
		if (existing != null && existing > 0) {
			return;
		}
		List<UUID> demoShops = jdbc.queryForList(
				"select id from shops where email like 'shop%@demo.local' order by email", UUID.class);
		if (demoShops.isEmpty()) {
			return;
		}
		Random rnd = new Random(42);
		LocalDate today = LocalDate.now(clock.withZone(ZONE));
		List<Object[]> rows = new ArrayList<>();
		for (int s = 0; s < demoShops.size(); s++) {
			UUID shop = demoShops.get(s);
			double popularity = Math.max(2, 26 - s * 4.5); // shop1 busiest
			for (int back = DAYS - 1; back >= 0; back--) {
				LocalDate day = today.minusDays(back);
				double weekend = switch (day.getDayOfWeek()) { case SATURDAY, SUNDAY -> 1.35; default -> 1.0; };
				double growth = 0.75 + 0.25 * (DAYS - back) / DAYS; // gently rising, like a new listing
				int views = (int) Math.round(popularity * weekend * growth * (0.7 + rnd.nextDouble() * 0.6));
				for (int v = 0; v < views; v++) {
					String visitor = "demo-" + s + "-" + back + "-" + v;
					String source = SOURCES[rnd.nextInt(SOURCES.length)];
					add(rows, shop, "VIEW", source, visitor, day, rnd);
					double r = rnd.nextDouble();
					if (r < 0.16) add(rows, shop, "CALL", source, visitor, day, rnd);
					else if (r < 0.27) add(rows, shop, "WHATSAPP", source, visitor, day, rnd);
					if (rnd.nextDouble() < 0.09) add(rows, shop, "DIRECTIONS", source, visitor, day, rnd);
				}
			}
		}
		jdbc.batchUpdate("insert into shop_events (shop_id, type, source, visitor_hash, created_at) values (?, ?, ?, ?, ?)", rows);
		log.info("Seeded {} demo activity events for {} demo shops", rows.size(), demoShops.size());
	}

	private void add(List<Object[]> rows, UUID shop, String type, String source, String visitor, LocalDate day, Random rnd) {
		// Between 7 AM and 10 PM local time, never in the future.
		var at = day.atTime(7 + rnd.nextInt(15), rnd.nextInt(60)).atZone(ZONE).toInstant();
		if (at.isAfter(clock.instant())) {
			at = clock.instant().minusSeconds(60 + rnd.nextInt(3600));
		}
		rows.add(new Object[] { shop, type, source, visitor, Timestamp.from(at) });
	}
}
