package com.localkart.config;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Basic brute-force protection for login/register: fixed window per client IP. In-memory, so it is
 * per instance; use a shared store (e.g. Redis) when running more than one instance.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

	private static final int LIMIT = 50;
	private static final long WINDOW_MS = 15 * 60 * 1000L;

	private record Window(long startedAt, int count) {
	}

	private final Map<String, Window> windows = new ConcurrentHashMap<>();

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !request.getRequestURI().startsWith("/api/auth/");
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		long now = System.currentTimeMillis();
		if (windows.size() > 10_000) {
			windows.values().removeIf(w -> now - w.startedAt() > WINDOW_MS);
		}
		Window w = windows.merge(request.getRemoteAddr(), new Window(now, 1),
				(old, fresh) -> now - old.startedAt() > WINDOW_MS ? fresh : new Window(old.startedAt(), old.count() + 1));
		if (w.count() > LIMIT) {
			response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"message\":\"Too many attempts, please try again later\"}");
			return;
		}
		chain.doFilter(request, response);
	}
}
