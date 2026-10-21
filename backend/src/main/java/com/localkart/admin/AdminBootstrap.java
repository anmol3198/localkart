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
 */
@Component
@Order(0)
public class AdminBootstrap implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

	private final AdminRepository admins;
	private final PasswordEncoder passwordEncoder;
	private final String email;
	private final String password;
	private final String name;

	public AdminBootstrap(AdminRepository admins, PasswordEncoder passwordEncoder,
			@Value("${localkart.admin.email:}") String email,
			@Value("${localkart.admin.password:}") String password,
			@Value("${localkart.admin.name:Super Admin}") String name) {
		this.admins = admins;
		this.passwordEncoder = passwordEncoder;
		this.email = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
		this.password = password;
		this.name = name;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (email.isEmpty()) {
			if (admins.count() == 0) log.warn("No LocalKart admin exists. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD to create one.");
			return;
		}
		if (admins.existsByEmail(email)) return;
		if (!email.matches(RegisterRequest.EMAIL)) {
			log.error("SUPER_ADMIN_EMAIL is not a valid email; no admin created");
			return;
		}
		if (password == null || !password.matches("^(?=.*[A-Za-z])(?=.*\\d)\\S.{8,70}\\S$")) {
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
}
