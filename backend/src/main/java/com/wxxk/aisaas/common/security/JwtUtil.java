package com.wxxk.aisaas.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtUtil {

    private static final long EXPIRATION_MS = 7L * 24 * 60 * 60 * 1000; // 7일

    @Value("${jwt.secret}")
    private String secret;

    @PostConstruct
    public void logSecretInfo() {
        // 기동 시 jwt.secret 로드 확인 (길이 32자 미만이면 HMAC-SHA256 키 강도 부족 경고)
        if (secret.length() < 32) {
            log.warn("[JwtUtil] jwt.secret is shorter than 32 chars ({}). Use a stronger secret in production.", secret.length());
        } else {
            log.info("[JwtUtil] jwt.secret loaded — length: {} chars", secret.length());
        }
    }

    public String generateToken(UUID userId, String email, String name, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("name", name)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(getKey())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
