package com.localkart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class LocalkartApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(LocalkartApiApplication.class, args);
	}
}
