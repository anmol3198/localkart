package com.localkart.config;

import java.util.UUID;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import com.localkart.auth.TokenService;
import com.localkart.shop.ShopRepository;
import java.nio.charset.StandardCharsets;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nimbusds.jose.jwk.source.ImmutableSecret;

@Configuration
public class SecurityConfig {

	private static final String VENDOR_PATHS = "/api/vendor/";

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		AuthenticationEntryPoint entryPoint = jsonEntryPoint();
		http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(VENDOR_PATHS + "**").authenticated()
						.anyRequest().permitAll())
				.oauth2ResourceServer(o -> o
						.jwt(Customizer.withDefaults())
						.bearerTokenResolver(vendorOnlyTokenResolver())
						.authenticationEntryPoint(entryPoint))
				.exceptionHandling(e -> e.authenticationEntryPoint(entryPoint));
		return http.build();
	}

	/**
	 * Only read the bearer token on vendor endpoints, so an expired vendor token never blocks
	 * public browsing.
	 */
	private static BearerTokenResolver vendorOnlyTokenResolver() {
		DefaultBearerTokenResolver delegate = new DefaultBearerTokenResolver();
		return request -> request.getRequestURI().startsWith(VENDOR_PATHS) ? delegate.resolve(request) : null;
	}

	private static AuthenticationEntryPoint jsonEntryPoint() {
		return (request, response, ex) -> {
			String header = request.getHeader("Authorization");
			String message = header != null && header.startsWith("Bearer ")
					? "Session expired, please login again"
					: "Login required";
			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"message\":\"" + message + "\"}");
		};
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	// Old built-in fallback that is public on GitHub; never accept it.
	private static final String KNOWN_PUBLIC_SECRET = "dev-only-secret-change-me-in-production!!";

	@Bean
	SecretKey jwtKey(AppProperties props) {
		return new SecretKeySpec(checkSecret(props.jwt().secret()).getBytes(StandardCharsets.UTF_8), "HmacSHA256");
	}

	/** Refuses to start with a missing, short or publicly known signing secret (anyone could forge logins). */
	static String checkSecret(String secret) {
		if (secret == null || secret.isBlank()) {
			throw new IllegalStateException("JWT_SECRET is not set. Set it to a random value of at least 32 characters, e.g. the output of: openssl rand -base64 48");
		}
		if (secret.equals(KNOWN_PUBLIC_SECRET)) {
			throw new IllegalStateException("JWT_SECRET is the public example value. Generate your own with: openssl rand -base64 48");
		}
		if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
			throw new IllegalStateException("JWT_SECRET must be at least 32 characters");
		}
		return secret;
	}

	@Bean
	JwtEncoder jwtEncoder(SecretKey jwtKey) {
		return new NimbusJwtEncoder(new ImmutableSecret<>(jwtKey));
	}

	@Bean
	JwtDecoder jwtDecoder(SecretKey jwtKey, ShopRepository shops) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtKey).macAlgorithm(MacAlgorithm.HS256).build();
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), tokenVersionValidator(shops)));
		return decoder;
	}

	/**
	 * A token is only valid while its "ver" claim matches the shop's current token version, so
	 * "log out of all devices" and password changes cut off older tokens. Also rejects deleted shops.
	 */
	static OAuth2TokenValidator<Jwt> tokenVersionValidator(ShopRepository shops) {
		OAuth2Error expired = new OAuth2Error("invalid_token", "Session expired, please login again", null);
		return jwt -> {
			try {
				Integer current = shops.findTokenVersion(UUID.fromString(jwt.getSubject())).orElse(null);
				Object claim = jwt.getClaims().get(TokenService.VERSION_CLAIM);
				int version = claim instanceof Number n ? n.intValue() : 0;
				return current != null && current == version ? OAuth2TokenValidatorResult.success() : OAuth2TokenValidatorResult.failure(expired);
			} catch (IllegalArgumentException e) {
				return OAuth2TokenValidatorResult.failure(expired);
			}
		};
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(AppProperties props) {
		CorsConfiguration cors = new CorsConfiguration();
		cors.setAllowedOriginPatterns(List.of(props.corsOrigin().split(",")));
		cors.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		cors.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", cors);
		return source;
	}
}
