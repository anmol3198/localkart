package com.localkart.product;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.localkart.common.ApiException;

class BarcodesTest {

	@Test
	void verifiesGs1CheckDigits() {
		assertTrue(Barcodes.checkDigitOk("4006381333931")); // EAN-13
		assertTrue(Barcodes.checkDigitOk("96385074"));      // EAN-8
		assertTrue(Barcodes.checkDigitOk("036000291452"));  // UPC-A
		assertFalse(Barcodes.checkDigitOk("4006381333930"));
	}

	@Test
	void normalisesAndRejects() {
		assertEquals("SHOP-01", Barcodes.validated(" shop-01 "));
		assertEquals("4006381333931", Barcodes.validated("4006 3813 3393 1"));
		assertThrows(ApiException.class, () -> Barcodes.validated("4006381333930"));
		assertThrows(ApiException.class, () -> Barcodes.validated("ab"));
		assertThrows(ApiException.class, () -> Barcodes.validated("bad code!"));
	}

	@Test
	void cleansEstimatedQuantityMark() {
		assertEquals("400 g", BarcodeLookupService.cleanQuantity("400 g e"));
		assertEquals("70 g", BarcodeLookupService.cleanQuantity("70 g \u212E"));
		assertEquals("1 L", BarcodeLookupService.cleanQuantity("1 L"));
	}
}
