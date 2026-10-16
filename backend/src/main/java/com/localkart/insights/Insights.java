package com.localkart.insights;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

/** What a vendor sees on the Insights dashboard for the last {@code days} days (today included). */
public record Insights(
		int days,
		LocalDate from,
		LocalDate to,
		String timezone,
		Totals totals,
		Totals previous,
		List<Day> daily,
		Map<String, Long> sources) {

	public record Totals(long views, long calls, long whatsapp, long directions) {

		/** Customers who reached out: calls + WhatsApp messages. */
		@JsonProperty("contacts")
		public long contacts() {
			return calls + whatsapp;
		}
	}

	public record Day(LocalDate date, long views, long calls, long whatsapp, long directions) {
	}
}
