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
		SpringApplication.from(LocalkartApiApplication::main).run(args);
	}
}
