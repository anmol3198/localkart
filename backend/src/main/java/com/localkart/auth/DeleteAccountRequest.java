package com.localkart.auth;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(@NotBlank(message = "Enter your password to confirm") String password) {
}
