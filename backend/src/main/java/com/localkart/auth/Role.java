package com.localkart.auth;

/** Carried in the login token ("role" claim) and checked on every protected endpoint. */
public enum Role {
	SHOP_OWNER, ADMIN, SUPER_ADMIN;

	public static final String CLAIM = "role";

	public String authority() {
		return "ROLE_" + name();
	}
}
