package com.localkart.config;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.access.AccessDeniedHandler;
import com.localkart.admin.AdminRepository;
import com.localkart.auth.Role;
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
	private static final String ADMIN_PATHS = "/api/admin/";
	private static final String ADMIN_LOGIN = "/api/admin/auth/";

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		AuthenticationEntryPoint entryPoint = jsonEntryPoint();
		http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				// Role checks happen here, on the server, for every request; hiding buttons in the apps is only cosmetic.
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(ADMIN_LOGIN + "**").permitAll()
						.requestMatchers(ADMIN_PATHS + "admins/**").hasRole(Role.SUPER_ADMIN.name())
						.requestMatchers(ADMIN_PATHS + "**").hasAnyRole(Role.ADMIN.name(), Role.SUPER_ADMIN.name())
						.requestMatchers(VENDOR_PATHS + "**").hasRole(Role.SHOP_OWNER.name())
						.anyRequest().permitAll())
				.oauth2ResourceServer(o -> o
						.jwt(jwt -> jwt.jwtAuthenticationConverter(roleConverter()))
						.bearerTokenResolver(protectedPathsTokenResolver())
						.authenticationEntryPoint(entryPoint))
				.exceptionHandling(e -> e.authenticationEntryPoint(entryPoint).accessDeniedHandler(jsonAccessDenied()));
		return http.build();
	}

	/**
	 * Only read the bearer token on vendor/admin endpoints (not the admin login itself), so an expired token
	 * never blocks public browsing or logging in again.
	 */
	private static BearerTokenResolver protectedPathsTokenResolver() {
		DefaultBearerTokenResolver delegate = new DefaultBearerTokenResolver();
		return request -> {
			String uri = request.getRequestURI();
			boolean isProtected = uri.startsWith(VENDOR_PATHS) || (uri.startsWith(ADMIN_PATHS) && !uri.startsWith(ADMIN_LOGIN));
			return isProtected ? delegate.resolve(request) : null;
		};
	}

	/** The token's "role" claim becomes the caller's authority. Tokens from before roles existed are shop owners. */
	static JwtAuthenticationConverter roleConverter() {
		JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
		converter.setJwtGrantedAuthoritiesConverter(jwt -> List.of(new SimpleGrantedAuthority(roleOf(jwt).authority())));
		return converter;
	}

	static Role roleOf(Jwt jwt) {
		try {
			String role = jwt.getClaimAsString(Role.CLAIM);
			return role == null ? Role.SHOP_OWNER : Role.valueOf(role);
		} catch (IllegalArgumentException e) {
			return Role.SHOP_OWNER;
		}
	}

	private static AccessDeniedHandler jsonAccessDenied() {
		return (request, response, ex) -> {
			response.setStatus(HttpStatus.FORBIDDEN.value());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"message\":\"You don't have access to this\"}");
		};
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
	JwtDecoder jwtDecoder(SecretKey jwtKey, ShopRepository shops, AdminRepository admins) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(jwtKey).macAlgorithm(MacAlgorithm.HS256).build();
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), tokenVersionValidator(shops, admins)));
		return decoder;
	}

	/**
	 * A token is only valid while its "ver" claim matches the shop's current token version, so
	 * "log out of all devices" and password changes cut off older tokens. Also rejects deleted shops.
	 */
	static OAuth2TokenValidator<Jwt> tokenVersionValidator(ShopRepository shops, AdminRepository admins) {
		OAuth2Error expired = new OAuth2Error("invalid_token", "Session expired, please login again", null);
		return jwt -> {
			try {
				UUID id = UUID.fromString(jwt.getSubject());
				// Admin tokens are checked against admin accounts (deactivated admins are cut off), shop tokens against shops.
				Integer current = roleOf(jwt) == Role.SHOP_OWNER ? shops.findTokenVersion(id).orElse(null)
						: admins.findActiveTokenVersion(id).orElse(null);
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
