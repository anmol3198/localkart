package com.localkart.common;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

/** An Indian mobile or landline number (already normalised by {@link PhoneNumbers#normalize}). Null is allowed. */
@Documented
@Constraint(validatedBy = IndianPhone.Validator.class)
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface IndianPhone {

	String message() default PhoneNumbers.INVALID;

	/** Whether "" is accepted (used to clear an optional number). */
	boolean allowBlank() default false;

	Class<?>[] groups() default {};

	Class<? extends Payload>[] payload() default {};

	class Validator implements ConstraintValidator<IndianPhone, String> {
		private boolean allowBlank;

		@Override
		public void initialize(IndianPhone a) {
			allowBlank = a.allowBlank();
		}

		@Override
		public boolean isValid(String value, ConstraintValidatorContext ctx) {
			if (value == null) return true;
			if (value.isBlank()) return allowBlank;
			return PhoneNumbers.isValid(value);
		}
	}
}
