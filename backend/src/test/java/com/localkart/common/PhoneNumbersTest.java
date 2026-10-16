package com.localkart.common;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PhoneNumbersTest {

	@Test
	void normalisesWhatPeopleType() {
		assertEquals("9876543210", PhoneNumbers.normalize("+91 98765 43210"));
		assertEquals("9876543210", PhoneNumbers.normalize("919876543210"));
		assertEquals("9876543210", PhoneNumbers.normalize("098765-43210"));
		assertEquals("9876543210", PhoneNumbers.normalize("(98765) 43210"));
		assertEquals("08023456789", PhoneNumbers.normalize("080 2345 6789"));
		assertEquals("+1 415 555 0101", PhoneNumbers.normalize("+1 415 555 0101"));
	}

	@Test
	void validatesIndianNumbers() {
		assertTrue(PhoneNumbers.isMobile("9876543210"));
		assertTrue(PhoneNumbers.isLandline("08023456789"));
		assertFalse(PhoneNumbers.isValid("5876543210"));  // mobiles start 6-9
		assertFalse(PhoneNumbers.isValid("9999999999"));  // repeated digits
		assertFalse(PhoneNumbers.isValid("00000000000"));
		assertFalse(PhoneNumbers.isValid("987654321"));
		assertFalse(PhoneNumbers.isMobile("08023456789"));
	}
}
