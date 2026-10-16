package com.localkart.common;

/**
 * Indian phone numbers. Accepts what people actually type (+91 98765 43210, 098765-43210, 080 2345 6789)
 * and stores one clean form: 10-digit mobiles, or 0 + STD code + number for landlines.
 */
public final class PhoneNumbers {

	public static final String INVALID = "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9 (or a landline with STD code, e.g. 080 2345 6789)";

	private PhoneNumbers() {
	}

	/** Strips formatting and the country/trunk prefix; returns the input unchanged if it isn't number-like. */
	public static String normalize(String raw) {
		if (raw == null) return null;
		String s = raw.trim();
		if (s.isEmpty()) return s;
		String digits = s.replaceAll("[\\s\\-().]", "");
		if (digits.startsWith("+91")) digits = digits.substring(3);
		else if (digits.startsWith("+")) return s; // other countries: left as typed, so validation rejects it
		if (digits.length() == 12 && digits.startsWith("91")) digits = digits.substring(2);
		// "0" + mobile. Only safe for 09…: STD codes never start with 9, but 06/07/08 are real landline codes
		// (e.g. 080 Bengaluru), so stripping their 0 would turn a landline into a different mobile number.
		if (digits.length() == 11 && digits.startsWith("09")) digits = digits.substring(1);
		return digits;
	}

	public static boolean isMobile(String n) {
		return n != null && n.matches("[6-9]\\d{9}") && !allSame(n);
	}

	public static boolean isLandline(String n) {
		return n != null && n.matches("0[1-9]\\d{9}") && !allSame(n.substring(1));
	}

	public static boolean isValid(String n) {
		return isMobile(n) || isLandline(n);
	}

	private static boolean allSame(String s) {
		return s.chars().distinct().count() == 1;
	}
}
