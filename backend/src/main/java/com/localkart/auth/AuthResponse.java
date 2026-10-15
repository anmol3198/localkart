package com.localkart.auth;

import com.localkart.shop.ShopView;

public record AuthResponse(String token, ShopView shop) {
}
