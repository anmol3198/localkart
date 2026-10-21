package com.localkart;

import java.io.IOException;
import java.nio.file.Path;

import org.springframework.boot.SpringApplication;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/**
 * Runs the API against an embedded PostgreSQL so no database install is needed for local dev.
 * Data persists in ./.pgdata between runs. Start with: ./mvnw spring-boot:test-run
 * (Set DB_URL and run the normal app instead to use a real PostgreSQL.)
 */
public class LocalDevApplication {

	public static void main(String[] args) throws IOException {
		EmbeddedPostgres pg = EmbeddedPostgres.builder()
				.setPort(Integer.parseInt(System.getenv().getOrDefault("DEV_DB_PORT", "54329")))
				.setDataDirectory(Path.of(".pgdata"))
				.setCleanDataDirectory(false)
				.start();
		Runtime.getRuntime().addShutdownHook(new Thread(() -> {
			try {
				pg.close();
			}
			catch (IOException ignored) {
				// shutting down anyway
			}
		}));
		System.setProperty("spring.datasource.url", pg.getJdbcUrl("postgres", "postgres"));
		System.setProperty("spring.datasource.username", "postgres");
		System.setProperty("spring.datasource.password", "postgres");
		// Throwaway signing secret for this computer only; production must set JWT_SECRET.
		if (System.getenv("JWT_SECRET") == null) {
			System.setProperty("localkart.jwt.secret", "local-dev-only-secret-not-for-production-0123456789");
		}
		// Local-only super admin for trying the admin area at http://localhost:5173/admin
		if (System.getenv("SUPER_ADMIN_EMAIL") == null) {
			System.setProperty("localkart.admin.email", "admin@localkart.test");
			System.setProperty("localkart.admin.password", "LocalAdmin2026");
			System.setProperty("localkart.admin.name", "Local Admin");
		}
		SpringApplication.from(LocalkartApiApplication::main).run(args);
	}
}
