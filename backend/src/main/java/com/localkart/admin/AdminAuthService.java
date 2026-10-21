package com.localkart.admin;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.auth.LoginAttemptLimiter;
import com.localkart.auth.TokenService;
import com.localkart.common.ApiException;

@Service
public class AdminAuthService {

	public record Session(String token, AdminView admin) {
	}

	private final AdminRepository admins;
	private final PasswordEncoder passwordEncoder;
	private final TokenService tokens;
	private final LoginAttemptLimiter attempts;
	private final AuditService audit;
	private final String dummyHash;

	public AdminAuthService(AdminRepository admins, PasswordEncoder passwordEncoder, TokenService tokens,
			LoginAttemptLimiter attempts, AuditService audit) {
		this.admins = admins;
		this.passwordEncoder = passwordEncoder;
		this.tokens = tokens;
		this.attempts = attempts;
		this.audit = audit;
		this.dummyHash = passwordEncoder.encode("not-a-real-password-0");
	}

	@Transactional
	public Session login(AdminRequests.Login req) {
		String email = req.email().trim().toLowerCase(Locale.ROOT);
		String key = "admin:" + email;
		attempts.check(key);
		Admin admin = admins.findByEmail(email).orElse(null);
		boolean ok = passwordEncoder.matches(req.password(), admin != null ? admin.getPasswordHash() : dummyHash);
		if (admin == null || !ok || !admin.isActive()) {
			attempts.recordFailure(key);
			throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		attempts.recordSuccess(key);
		admin.setLastLoginAt(Instant.now());
		return new Session(tokens.issue(admin), AdminView.of(admin));
	}

	@Transactional(readOnly = true)
	public Admin get(UUID id) {
		return admins.findById(id).filter(Admin::isActive).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Session expired, please login again"));
	}

	@Transactional
	public Session changePassword(UUID id, AdminRequests.ChangePassword req) {
		Admin admin = get(id);
		if (!passwordEncoder.matches(req.currentPassword(), admin.getPasswordHash())) {
			throw ApiException.badRequest("Current password is incorrect");
		}
		if (req.currentPassword().equals(req.newPassword())) {
			throw ApiException.badRequest("New password must be different from the current one");
		}
		admin.setPasswordHash(passwordEncoder.encode(req.newPassword()));
		admin.setTokenVersion(admin.getTokenVersion() + 1);
		admins.saveAndFlush(admin);
		audit.log(admin, "PASSWORD_CHANGED", "ADMIN", admin.getId(), admin.getEmail(), null);
		return new Session(tokens.issue(admin), AdminView.of(admin));
	}
}
