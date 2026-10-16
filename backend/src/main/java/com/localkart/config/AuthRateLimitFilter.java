package com.localkart.config;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
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
 * Basic abuse protection, fixed window per client IP: login/register (brute force) and the public
 * activity endpoint (inflated shop stats). In-memory, so it is per instance; use a shared store
 * (e.g. Redis) when running more than one instance.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

	private static final long WINDOW_MS = 15 * 60 * 1000L;
	private static final int AUTH_LIMIT = 50;
	private static final int EVENTS_LIMIT = 300;
	private static final Pattern EVENTS_PATH = Pattern.compile("^/api/shops/[^/]+/events$");

	private record Window(long startedAt, int count) {
	}

	private final Map<String, Window> windows = new ConcurrentHashMap<>();

	private static boolean isAuth(HttpServletRequest request) {
		return request.getRequestURI().startsWith("/api/auth/");
	}

	private static boolean isEvent(HttpServletRequest request) {
		return "POST".equals(request.getMethod()) && EVENTS_PATH.matcher(request.getRequestURI()).matches();
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !isAuth(request) && !isEvent(request);
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		long now = System.currentTimeMillis();
		if (windows.size() > 10_000) {
			windows.values().removeIf(w -> now - w.startedAt() > WINDOW_MS);
		}
		boolean auth = isAuth(request);
		Window w = windows.merge((auth ? "auth|" : "events|") + request.getRemoteAddr(), new Window(now, 1),
				(old, fresh) -> now - old.startedAt() > WINDOW_MS ? fresh : new Window(old.startedAt(), old.count() + 1));
		if (w.count() > (auth ? AUTH_LIMIT : EVENTS_LIMIT)) {
			response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write(auth ? "{\"message\":\"Too many attempts, please try again later\"}"
					: "{\"message\":\"Too many requests, please slow down\"}");
			return;
		}
		chain.doFilter(request, response);
	}
}
