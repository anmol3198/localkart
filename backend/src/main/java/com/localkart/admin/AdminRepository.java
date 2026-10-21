package com.localkart.admin;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminRepository extends JpaRepository<Admin, UUID> {

	Optional<Admin> findByEmail(String email);

	boolean existsByEmail(String email);

	List<Admin> findAllByOrderByCreatedAtAsc();

	/** Token version of an active admin; empty when missing or deactivated (their tokens stop working). */
	@Query("select a.tokenVersion from Admin a where a.id = :id and a.active = true")
	Optional<Integer> findActiveTokenVersion(@Param("id") UUID id);
}
