package com.localkart.insights;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShopEventRepository extends JpaRepository<ShopEvent, Long> {

	boolean existsByShopIdAndVisitorHashAndTypeAndCreatedAtAfter(UUID shopId, String visitorHash, EventType type,
			Instant after);

	interface DailyCount {
		LocalDate getDay();

		String getType();

		long getTotal();
	}

	interface SourceCount {
		String getSource();

		long getTotal();
	}

	/** Event counts per local calendar day and type, for {@code from <= created_at < to}. */
	@Query(nativeQuery = true, value = """
			select cast(created_at at time zone :zone as date) as day, type, count(*) as total
			from shop_events
			where shop_id = :shopId and created_at >= :from and created_at < :to
			group by 1, 2""")
	List<DailyCount> countByDay(@Param("shopId") UUID shopId, @Param("from") Instant from, @Param("to") Instant to,
			@Param("zone") String zone);

	@Query(nativeQuery = true, value = """
			select source, count(*) as total
			from shop_events
			where shop_id = :shopId and created_at >= :from and created_at < :to
			group by source""")
	List<SourceCount> countBySource(@Param("shopId") UUID shopId, @Param("from") Instant from, @Param("to") Instant to);
}
