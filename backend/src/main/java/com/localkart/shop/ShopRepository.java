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

	List<Shop> findByLatitudeBetweenAndLongitudeBetween(double minLat, double maxLat, double minLng, double maxLng);
}
