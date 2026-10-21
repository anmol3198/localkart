package com.localkart.admin;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.localkart.auth.Role;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** A LocalKart staff account (ADMIN or SUPER_ADMIN). */
@Entity
@Table(name = "admins")
@Getter
@Setter
public class Admin {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	private String email;
	private String name;
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	private Role role = Role.ADMIN;

	private boolean active = true;
	private int tokenVersion;
	private Instant lastLoginAt;

	@CreationTimestamp
	private Instant createdAt;

	@UpdateTimestamp
	private Instant updatedAt;
}
