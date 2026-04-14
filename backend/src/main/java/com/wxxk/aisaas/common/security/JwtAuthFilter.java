package com.wxxk.aisaas.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        String header = request.getHeader("Authorization");
        String uri = request.getRequestURI();

        if (header == null || !header.startsWith("Bearer ")) {
            // Authorization 헤더 자체가 없는 경우 — 프론트에서 토큰을 안 보낸 것.
            // /api/auth/login, /api/auth/register 는 정상적으로 헤더가 없으므로 DEBUG로만 기록.
            log.debug("[JwtAuthFilter] No Bearer token — method={} uri={}", request.getMethod(), uri);
        } else {
            String token = header.substring(7);
            try {
                var claims = jwtUtil.parseToken(token);
                var auth = new UsernamePasswordAuthenticationToken(
                        claims.getSubject(), null, Collections.emptyList());
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("[JwtAuthFilter] Authenticated — uri={} subject={}", uri, claims.getSubject());
            } catch (Exception e) {
                // 유효하지 않은 토큰 (만료·서명 불일치 등) → anonymous로 통과, 인가 단계에서 차단
                log.warn("[JwtAuthFilter] JWT parse failed — {}: {} uri={}", e.getClass().getSimpleName(), e.getMessage(), uri);
            }
        }
        chain.doFilter(request, response);
    }
}
