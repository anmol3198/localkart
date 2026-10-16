package com.localkart.config;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Predicate;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Abuse protection, fixed 15-minute window per client IP (the real one behind a proxy, see
 * server.forward-headers-strategy):
 * - login/register: brute force (per-account limits are in LoginAttemptLimiter)
 * - activity events: inflated shop stats
 * - public browsing: bulk copying of shop phone numbers
 * In-memory, so it is per instance; use a shared store (e.g. Redis) when running more than one instance.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

	private static final long WINDOW_MS = 15 * 60 * 1000L;
	private static final Pattern EVENTS_PATH = Pattern.compile("^/api/shops/[^/]+/events$");

	private record Rule(String name, int limit, String message, Predicate<HttpServletRequest> matches) {
	}

	private static final List<Rule> RULES = List.of(
			new Rule("auth", 50, "Too many attempts, please try again later",
					r -> r.getRequestURI().startsWith("/api/auth/")),
			new Rule("events", 300, "Too many requests, please slow down",
					r -> "POST".equals(r.getMethod()) && EVENTS_PATH.matcher(r.getRequestURI()).matches()),
			// ~40 a minute: far above normal browsing, well below scripted scraping
			new Rule("browse", 600, "Too many requests, please slow down",
					r -> "GET".equals(r.getMethod()) && (r.getRequestURI().startsWith("/api/shops") || r.getRequestURI().equals("/api/meta"))));

	private record Window(long startedAt, int count) {
	}

	private final Map<String, Window> windows = new ConcurrentHashMap<>();

	private static Rule ruleFor(HttpServletRequest request) {
		return RULES.stream().filter(r -> r.matches().test(request)).findFirst().orElse(null);
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return ruleFor(request) == null;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		Rule rule = ruleFor(request);
		long now = System.currentTimeMillis();
		if (windows.size() > 50_000) {
			windows.values().removeIf(w -> now - w.startedAt() > WINDOW_MS);
		}
		Window w = windows.merge(rule.name() + "|" + request.getRemoteAddr(), new Window(now, 1),
				(old, fresh) -> now - old.startedAt() > WINDOW_MS ? fresh : new Window(old.startedAt(), old.count() + 1));
		if (w.count() > rule.limit()) {
			long retryAfter = Math.max(1, (w.startedAt() + WINDOW_MS - now) / 1000);
			response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
			response.setHeader("Retry-After", String.valueOf(retryAfter));
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"message\":\"" + rule.message() + "\"}");
			return;
		}
		chain.doFilter(request, response);
	}
}
