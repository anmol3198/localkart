package com.localkart.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.localkart.common.ApiException;

/**
 * Per-account protection against password guessing from many devices/IPs: after {@value #MAX_FAILURES}
 * wrong passwords within the window, that account can't log in until the window ends. In-memory (per instance).
 */
@Component
public class LoginAttemptLimiter {

	static final int MAX_FAILURES = 10;
	static final Duration WINDOW = Duration.ofMinutes(15);

	private record Failures(Instant firstAt, int count) {
	}

	private final Map<String, Failures> failures = new ConcurrentHashMap<>();
	private final Clock clock;

	public LoginAttemptLimiter(Clock clock) {
		this.clock = clock;
	}

	/** Throws 429 when this account is temporarily locked. */
	public void check(String account) {
		Failures f = current(account);
		if (f != null && f.count() >= MAX_FAILURES) {
			long minutes = Math.max(1, Duration.between(clock.instant(), f.firstAt().plus(WINDOW)).toMinutes() + 1);
			throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
					"Too many wrong passwords for this account. Please try again in " + minutes + " minute" + (minutes == 1 ? "" : "s"));
		}
	}

	public void recordFailure(String account) {
		Instant now = clock.instant();
		if (failures.size() > 50_000) {
			failures.values().removeIf(f -> f.firstAt().plus(WINDOW).isBefore(now));
		}
		failures.merge(account, new Failures(now, 1),
				(old, fresh) -> old.firstAt().plus(WINDOW).isBefore(now) ? fresh : new Failures(old.firstAt(), old.count() + 1));
	}

	public void recordSuccess(String account) {
		failures.remove(account);
	}

	private Failures current(String account) {
		Failures f = failures.get(account);
		return f == null || f.firstAt().plus(WINDOW).isBefore(clock.instant()) ? null : f;
	}
}
