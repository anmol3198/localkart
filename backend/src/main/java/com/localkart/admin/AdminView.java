package com.localkart.admin;

import java.time.Instant;
import java.util.UUID;

import com.localkart.auth.Role;

public record AdminView(UUID id, String email, String name, Role role, boolean active, Instant lastLoginAt, Instant createdAt) {

	public static AdminView of(Admin a) {
		return new AdminView(a.getId(), a.getEmail(), a.getName(), a.getRole(), a.isActive(), a.getLastLoginAt(), a.getCreatedAt());
	}
}
