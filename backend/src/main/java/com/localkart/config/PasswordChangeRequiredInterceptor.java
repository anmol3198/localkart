package com.localkart.config;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.localkart.shop.ShopRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * After staff issue a temporary password, the shop owner can only read their shop and set a new password;
 * everything else in the owner area answers 403 until they do. Old app versions then show this message.
 */
@Component
public class PasswordChangeRequiredInterceptor implements HandlerInterceptor, WebMvcConfigurer {

	static final String MESSAGE = "Please set a new password to continue";

	private final ShopRepository shops;

	public PasswordChangeRequiredInterceptor(ShopRepository shops) {
		this.shops = shops;
	}

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(this).addPathPatterns("/api/vendor/**");
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
		String path = request.getRequestURI();
		String method = request.getMethod();
		boolean allowed = ("PUT".equals(method) && path.equals("/api/vendor/password"))
				|| ("GET".equals(method) && path.equals("/api/vendor/shop"));
		if (allowed) return true;
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) return true; // security has already answered
		UUID shopId;
		try {
			shopId = UUID.fromString(jwt.getSubject());
		} catch (IllegalArgumentException e) {
			return true;
		}
		if (!shops.findMustChangePassword(shopId).orElse(false)) return true;
		response.setStatus(HttpStatus.FORBIDDEN.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write("{\"message\":\"" + MESSAGE + "\",\"code\":\"PASSWORD_CHANGE_REQUIRED\"}");
		return false;
	}
}
