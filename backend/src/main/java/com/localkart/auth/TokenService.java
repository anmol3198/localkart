package com.localkart.auth;

import java.time.Instant;
import java.util.UUID;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.localkart.config.AppProperties;
import com.localkart.shop.Shop;

@Service
public class TokenService {

	private final JwtEncoder encoder;
	private final AppProperties props;

	public TokenService(JwtEncoder encoder, AppProperties props) {
		this.encoder = encoder;
		this.props = props;
	}

	public static final String VERSION_CLAIM = "ver";

	/** Signed HS256 token whose subject is the shop id; "ver" must match the shop's current token version. */
	public String issue(Shop shop) {
		return issue(shop.getId(), shop.getTokenVersion(), Role.SHOP_OWNER);
	}

	public String issue(com.localkart.admin.Admin admin) {
		return issue(admin.getId(), admin.getTokenVersion(), admin.getRole());
	}

	public String issue(UUID subject, int version, Role role) {
		Instant now = Instant.now();
		JwtClaimsSet claims = JwtClaimsSet.builder()
				.issuer("localkart")
				.subject(subject.toString())
				.issuedAt(now)
				.expiresAt(now.plus(props.jwt().ttl()))
				.claim(VERSION_CLAIM, version)
				.claim(Role.CLAIM, role.name())
				.build();
		JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
		return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
	}
}
