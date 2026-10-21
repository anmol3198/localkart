package com.localkart.admin;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.localkart.common.ApiException;
import com.localkart.shop.ShopStatus;

import jakarta.validation.Valid;

/**
 * LocalKart staff area. Access rules live in SecurityConfig: /api/admin/** needs ADMIN or SUPER_ADMIN,
 * /api/admin/admins/** needs SUPER_ADMIN, /api/admin/auth/** is open (login).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final AdminAuthService auth;
	private final AdminShopService shops;
	private final AdminStatsService stats;
	private final AdminUserService users;
	private final AuditService audit;

	public AdminController(AdminAuthService auth, AdminShopService shops, AdminStatsService stats, AdminUserService users,
			AuditService audit) {
		this.auth = auth;
		this.shops = shops;
		this.stats = stats;
		this.users = users;
		this.audit = audit;
	}

	private Admin me(Jwt jwt) {
		return auth.get(UUID.fromString(jwt.getSubject()));
	}

	@PostMapping("/auth/login")
	public AdminAuthService.Session login(@Valid @RequestBody AdminRequests.Login req) {
		return auth.login(req);
	}

	@GetMapping("/me")
	public AdminView whoami(@AuthenticationPrincipal Jwt jwt) {
		return AdminView.of(me(jwt));
	}

	@PutMapping("/me/password")
	public AdminAuthService.Session changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AdminRequests.ChangePassword req) {
		return auth.changePassword(UUID.fromString(jwt.getSubject()), req);
	}

	@GetMapping("/stats")
	public AdminStatsService.Stats stats() {
		return stats.stats();
	}

	@GetMapping("/shops")
	public AdminShopService.PageResult<AdminShopView> shops(@RequestParam(required = false) String status,
			@RequestParam(required = false) String q, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return shops.list(parseStatus(status), q, page, size);
	}

	@GetMapping("/shops/{id}")
	public AdminShopView shop(@PathVariable UUID id) {
		return shops.detail(id);
	}

	@PostMapping("/shops/{id}/approve")
	public AdminShopView approve(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody(required = false) AdminRequests.Review req) {
		return shops.approve(id, req == null ? null : req.trimmed(), me(jwt));
	}

	@PostMapping("/shops/{id}/reject")
	public AdminShopView reject(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody(required = false) AdminRequests.Review req) {
		return shops.reject(id, req == null ? null : req.trimmed(), me(jwt));
	}

	@PostMapping("/shops/{id}/suspend")
	public AdminShopView suspend(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody(required = false) AdminRequests.Review req) {
		return shops.suspend(id, req == null ? null : req.trimmed(), me(jwt));
	}

	@PostMapping("/shops/{id}/reinstate")
	public AdminShopView reinstate(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @Valid @RequestBody(required = false) AdminRequests.Review req) {
		return shops.reinstate(id, req == null ? null : req.trimmed(), me(jwt));
	}

	@GetMapping("/audit")
	public AdminShopService.PageResult<AuditEntry> audit(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "30") int size) {
		var p = audit.recent(page, size);
		return new AdminShopService.PageResult<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages());
	}

	// ---- Super admin only (enforced in SecurityConfig) ----

	@GetMapping("/admins")
	public List<AdminView> admins() {
		return users.list();
	}

	@PostMapping("/admins")
	@ResponseStatus(HttpStatus.CREATED)
	public AdminView createAdmin(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AdminRequests.CreateAdmin req) {
		return users.create(req, me(jwt));
	}

	@PutMapping("/admins/{id}/active")
	public AdminView setActive(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody AdminRequests.SetActive req) {
		return users.setActive(id, req.active(), me(jwt));
	}

	private static ShopStatus parseStatus(String s) {
		if (s == null || s.isBlank() || s.equalsIgnoreCase("all")) return null;
		try {
			return ShopStatus.valueOf(s.toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException e) {
			throw ApiException.badRequest("status must be pending, approved, rejected, suspended or all");
		}
	}
}
