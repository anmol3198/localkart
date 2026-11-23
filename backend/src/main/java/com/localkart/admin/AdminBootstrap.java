package com.localkart.admin;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.localkart.auth.RegisterRequest;
import com.localkart.auth.Role;

/**
 * Creates the first SUPER_ADMIN from SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD when that email has no account yet.
 * After that, admins are managed from the admin area; the variables can be removed.
 *
 * Forgotten password: with SUPER_ADMIN_RESET_PASSWORD=true as well, the next start sets that account's password to
 * SUPER_ADMIN_PASSWORD, makes it an active SUPER_ADMIN again and signs it out everywhere. Only someone who can change
 * the server's settings can do this; the reset is written to the audit log and the variable should then be removed.
 */
@Component
@Order(0)
public class AdminBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
	private static final String PASSWORD_RULE = "^(?=.*[A-Za-z])(?=.*\\d)\\S.{8,70}\\S$";

	private final AdminRepository admins;
	private final PasswordEncoder passwordEncoder;
	private final AuditService audit;
	private final String email;
	private final String password;
	private final String name;
	private final boolean resetPassword;

	public AdminBootstrap(AdminRepository admins, PasswordEncoder passwordEncoder, AuditService audit,
			@Value("${localkart.admin.email:}") String email,
			@Value("${localkart.admin.password:}") String password,
			@Value("${localkart.admin.name:Super Admin}") String name,
			@Value("${localkart.admin.reset-password:false}") boolean resetPassword) {
		this.admins = admins;
		this.passwordEncoder = passwordEncoder;
		this.audit = audit;
		this.email = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
		this.password = password;
		this.name = name;
		this.resetPassword = resetPassword;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (email.isEmpty()) {
			if (admins.count() == 0) log.warn("No LocalKart admin exists. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD to create one.");
			if (resetPassword) log.error("SUPER_ADMIN_RESET_PASSWORD is set but SUPER_ADMIN_EMAIL is empty; nothing was reset");
			return;
		}
		Admin existing = admins.findByEmail(email).orElse(null);
		if (existing != null) {
			if (resetPassword) reset(existing);
			return;
		}
		if (!email.matches(RegisterRequest.EMAIL)) {
			log.error("SUPER_ADMIN_EMAIL is not a valid email; no admin created");
			return;
		}
		if (!validPassword()) {
			log.error("SUPER_ADMIN_PASSWORD must be 10-72 characters with letters and numbers; no admin created");
			return;
		}
		Admin a = new Admin();
		a.setEmail(email);
		a.setName(name);
		a.setRole(Role.SUPER_ADMIN);
		a.setPasswordHash(passwordEncoder.encode(password));
		admins.save(a);
		log.info("Created super admin {}", email);
	}

	private void reset(Admin a) {
		if (!validPassword()) {
			log.error("SUPER_ADMIN_PASSWORD must be 10-72 characters with letters and numbers; password NOT reset for {}", email);
			return;
		}
		if (passwordEncoder.matches(password, a.getPasswordHash()) && a.isActive() && a.getRole() == Role.SUPER_ADMIN) {
			// Already done on an earlier start: don't sign everyone out again on every restart.
			log.warn("Super admin {} already uses SUPER_ADMIN_PASSWORD. Remove SUPER_ADMIN_RESET_PASSWORD from the server settings.", email);
			return;
		}
		a.setPasswordHash(passwordEncoder.encode(password));
		a.setRole(Role.SUPER_ADMIN);
		a.setActive(true);
		a.setTokenVersion(a.getTokenVersion() + 1);
		admins.save(a);
		audit.log(a, "ADMIN_PASSWORD_RESET", "ADMIN", a.getId(), a.getEmail(), "Password reset from server settings (SUPER_ADMIN_RESET_PASSWORD)");
		log.warn("Reset the password of super admin {} and signed it out everywhere. Now remove SUPER_ADMIN_RESET_PASSWORD from the server settings.", email);
	}

	private boolean validPassword() {
		return password != null && password.matches(PASSWORD_RULE);
	}
}
