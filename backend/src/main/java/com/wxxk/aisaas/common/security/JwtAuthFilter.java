package com.wxxk.aisaas.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    /**
     * H2 콘솔 경로는 JWT 인증과 무관하므로 필터 실행을 건너뛴다.
     * DevSecurityConfig 가 H2 콘솔 요청을 전담하므로 이 필터가 개입할 필요가 없다.
     * (prod에서는 H2 콘솔 자체가 비활성화되므로 이 경로에 요청이 오지 않는다)
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getServletPath().startsWith("/h2-console");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        String header = request.getHeader("Authorization");
        String uri = request.getRequestURI();

        if (header == null || !header.startsWith("Bearer ")) {
            // Authorization 헤더 자체가 없는 경우 — 프론트에서 토큰을 안 보낸 것.
            // /api/auth
            // /login, /api/auth/register 는 정상적으로 헤더가 없으므로 DEBUG로만 기록.
            log.debug("[JwtAuthFilter] No Bearer token — method={} uri={}", request.getMethod(), uri);
        } else {
            String token = header.substring(7);
            try {
                var claims = jwtUtil.parseToken(token);
                String role = claims.get("role", String.class);
                List<GrantedAuthority> authorities = role != null
                        ? List.of(new SimpleGrantedAuthority(role))
                        : Collections.emptyList();
                var auth = new UsernamePasswordAuthenticationToken(
                        claims.getSubject(), null, authorities);
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
