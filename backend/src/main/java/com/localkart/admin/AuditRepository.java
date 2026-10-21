package com.localkart.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditRepository extends JpaRepository<AuditEntry, Long> {

	Page<AuditEntry> findAllByOrderByCreatedAtDescIdDesc(Pageable page);
}
