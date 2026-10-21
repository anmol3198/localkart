package com.localkart.shop;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopRepository extends JpaRepository<Shop, UUID> {

	Optional<Shop> findByEmail(String email);

	boolean existsByEmail(String email);

	@org.springframework.data.jpa.repository.Query("select s.tokenVersion from Shop s where s.id = :id")
	Optional<Integer> findTokenVersion(@org.springframework.data.repository.query.Param("id") UUID id);

	List<Shop> findByLatitudeBetweenAndLongitudeBetweenAndStatus(double minLat, double maxLat, double minLng, double maxLng,
			ShopStatus status);

	Optional<Shop> findByIdAndStatus(UUID id, ShopStatus status);

	boolean existsByIdAndStatus(UUID id, ShopStatus status);

	long countByStatus(ShopStatus status);

	/** Admin search. {@code pattern} is a lower-cased LIKE pattern escaped with '!'. */
	@org.springframework.data.jpa.repository.Query("""
			select s from Shop s
			where lower(s.shopName) like :pattern escape '!' or lower(s.ownerName) like :pattern escape '!'
			   or lower(s.email) like :pattern escape '!' or s.phone like :pattern escape '!'
			order by s.submittedAt desc nulls last""")
	org.springframework.data.domain.Page<Shop> search(@org.springframework.data.repository.query.Param("pattern") String pattern,
			org.springframework.data.domain.Pageable page);

	@org.springframework.data.jpa.repository.Query("""
			select s from Shop s
			where s.status = :status
			  and (lower(s.shopName) like :pattern escape '!' or lower(s.ownerName) like :pattern escape '!'
			   or lower(s.email) like :pattern escape '!' or s.phone like :pattern escape '!')
			order by s.submittedAt asc nulls last""")
	org.springframework.data.domain.Page<Shop> searchByStatus(@org.springframework.data.repository.query.Param("status") ShopStatus status,
			@org.springframework.data.repository.query.Param("pattern") String pattern, org.springframework.data.domain.Pageable page);
}
