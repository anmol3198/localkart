package com.localkart.admin;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.auth.Role;
import com.localkart.common.ApiException;

/** Super admins manage staff accounts. */
@Service
public class AdminUserService {

	private final AdminRepository admins;
	private final PasswordEncoder passwordEncoder;
	private final AuditService audit;

	public AdminUserService(AdminRepository admins, PasswordEncoder passwordEncoder, AuditService audit) {
		this.admins = admins;
		this.passwordEncoder = passwordEncoder;
		this.audit = audit;
	}

	@Transactional(readOnly = true)
	public List<AdminView> list() {
		return admins.findAllByOrderByCreatedAtAsc().stream().map(AdminView::of).toList();
	}

	@Transactional
	public AdminView create(AdminRequests.CreateAdmin req, Admin by) {
		String email = req.email().trim().toLowerCase(Locale.ROOT);
		if (admins.existsByEmail(email)) {
			throw new ApiException(HttpStatus.CONFLICT, "An admin with this email already exists");
		}
		Admin a = new Admin();
		a.setEmail(email);
		a.setName(req.name().trim().replaceAll("\\s+", " "));
		a.setRole(Role.valueOf(req.role()));
		a.setPasswordHash(passwordEncoder.encode(req.password()));
		a = admins.saveAndFlush(a);
		audit.log(by, "ADMIN_CREATED", "ADMIN", a.getId(), a.getEmail(), "Role " + a.getRole());
		return AdminView.of(a);
	}

	/** Deactivating signs the admin out everywhere immediately. */
	@Transactional
	public AdminView setActive(UUID id, boolean active, Admin by) {
		Admin a = admins.findById(id).orElseThrow(() -> ApiException.notFound("Admin not found"));
		if (a.getId().equals(by.getId())) {
			throw ApiException.badRequest("You can't deactivate your own account");
		}
		if (!active && a.getRole() == Role.SUPER_ADMIN && admins.findAll().stream()
				.filter(x -> x.isActive() && x.getRole() == Role.SUPER_ADMIN).count() <= 1) {
			throw ApiException.badRequest("There must always be at least one active super admin");
		}
		if (a.isActive() == active) return AdminView.of(a);
		a.setActive(active);
		a.setTokenVersion(a.getTokenVersion() + 1);
		a = admins.saveAndFlush(a);
		audit.log(by, active ? "ADMIN_REACTIVATED" : "ADMIN_DEACTIVATED", "ADMIN", a.getId(), a.getEmail(), null);
		return AdminView.of(a);
	}
}
