package com.localkart.insights;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "shop_events")
@Getter
@Setter
public class ShopEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, updatable = false)
	private UUID shopId;

	@Enumerated(EnumType.STRING)
	private EventType type;

	@Enumerated(EnumType.STRING)
	private EventSource source;

	private String visitorHash;

	@CreationTimestamp
	private Instant createdAt;
}
