package com.localkart.insights;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
public class InsightsController {

	private final InsightsService insights;

	public InsightsController(InsightsService insights) {
		this.insights = insights;
	}

	/** Public: the apps report a shop view or a call/WhatsApp/directions tap. */
	@PostMapping("/api/shops/{id}/events")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public void record(@PathVariable UUID id, @Valid @RequestBody EventRequest req, HttpServletRequest http) {
		String ua = http.getHeader("User-Agent");
		insights.record(id, req, http.getRemoteAddr() + "|" + (ua == null ? "" : ua));
	}

	/** The logged-in vendor's own numbers. */
	@GetMapping("/api/vendor/insights")
	public Insights mine(@AuthenticationPrincipal Jwt jwt, @RequestParam(defaultValue = "7") int days) {
		return insights.forShop(UUID.fromString(jwt.getSubject()), days);
	}
}
