package com.localkart.insights;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * A customer action on a shop. {@code visitorId} is a random id the app keeps on the device, so repeat taps
 * can be counted once without identifying anyone.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record EventRequest(
		@NotBlank(message = "Event type is required")
		@Pattern(regexp = "(?i)VIEW|CALL|WHATSAPP|DIRECTIONS", message = "Event type must be VIEW, CALL, WHATSAPP or DIRECTIONS") String type,
		@Pattern(regexp = "(?i)WEB|ANDROID|IOS", message = "Source must be WEB, ANDROID or IOS") String source,
		@Pattern(regexp = "^[A-Za-z0-9-]{8,64}$", message = "Invalid visitor id") String visitorId) {
}
