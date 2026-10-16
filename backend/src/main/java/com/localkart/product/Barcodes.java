package com.localkart.product;

import java.util.Locale;
import java.util.Set;

import com.localkart.common.ApiException;

/** Barcode clean-up and checks. Retail codes (EAN-8, UPC-A, EAN-13, GTIN-14) carry a check digit we can verify. */
public final class Barcodes {

	private static final Set<Integer> GTIN_LENGTHS = Set.of(8, 12, 13, 14);

	private Barcodes() {
	}

	public static String normalize(String raw) {
		return raw == null ? null : raw.trim().replace(" ", "").toUpperCase(Locale.ROOT);
	}

	public static boolean isGtin(String code) {
		return code != null && GTIN_LENGTHS.contains(code.length()) && code.chars().allMatch(Character::isDigit);
	}

	/** Normalises the code; rejects retail codes whose check digit is wrong (almost always a typo). */
	public static String validated(String raw) {
		String code = normalize(raw);
		if (code.length() < 4 || code.length() > 32 || !code.matches("[0-9A-Z-]+")) {
			throw ApiException.badRequest("Barcode can only have letters, numbers and dashes (4-32 characters)");
		}
		if (isGtin(code) && !checkDigitOk(code)) {
			throw ApiException.badRequest("This barcode looks mistyped: its last digit doesn't match. Please scan it again");
		}
		return code;
	}

	/** GS1 mod-10: from the right (excluding the check digit), weights alternate 3, 1. */
	static boolean checkDigitOk(String code) {
		int sum = 0;
		for (int i = code.length() - 2, w = 3; i >= 0; i--, w = 4 - w) {
			sum += (code.charAt(i) - '0') * w;
		}
		return (10 - sum % 10) % 10 == code.charAt(code.length() - 1) - '0';
	}
}
