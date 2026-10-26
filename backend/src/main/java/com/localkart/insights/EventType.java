package com.localkart.insights;

import java.time.Duration;

/** What a customer did on a shop. Repeats from the same visitor inside {@code dedupeWindow} count once. */
public enum EventType {
	VIEW(Duration.ofMinutes(30)),
	CALL(Duration.ofMinutes(5)),
	WHATSAPP(Duration.ofMinutes(5)),
	DIRECTIONS(Duration.ofMinutes(5)),
	// Order sent from the cart. A short window: a second, different order soon after is real.
	ORDER(Duration.ofSeconds(30));

	private final Duration dedupeWindow;

	EventType(Duration dedupeWindow) {
		this.dedupeWindow = dedupeWindow;
	}

	public Duration dedupeWindow() {
		return dedupeWindow;
	}
}
