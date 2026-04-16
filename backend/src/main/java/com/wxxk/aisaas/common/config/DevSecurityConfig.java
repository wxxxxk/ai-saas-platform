package com.wxxk.aisaas.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * H2 콘솔 전용 Security 설정 — dev / 비-prod 환경에서만 활성화된다.
 *
 * @Profile("!prod"): prod 프로필에서는 이 Bean 자체가 생성되지 않는다.
 *   → prod에서는 H2 콘솔이 비활성화(spring.h2.console.enabled=false)되어 있고,
 *     이 SecurityFilterChain도 존재하지 않으므로 이중으로 보호된다.
 *
 * @Order(1): 메인 SecurityConfig(순서 없음 → Integer.MAX_VALUE)보다 먼저 실행된다.
 *   securityMatcher로 H2 콘솔 경로만 처리하고, 나머지는 메인 체인에 위임한다.
 *
 * securityMatcher("/h2-console", "/h2-console/**"):
 *   - "/h2-console"  : trailing slash 없는 최초 접근 (브라우저 주소창 직접 입력)
 *   - "/h2-console/**": 이후 로그인 폼 POST, 프레임 내부 리소스 요청 등
 *   두 패턴을 모두 명시해야 누락 없이 매칭된다.
 */
@Configuration
@Profile("!prod")
public class DevSecurityConfig {

    @Bean
    @Order(1)
    public SecurityFilterChain h2ConsoleSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
                // 이 체인은 H2 콘솔 경로만 담당한다
                .securityMatcher("/h2-console", "/h2-console/**")
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                // H2 콘솔은 POST로 로그인 폼을 제출하므로 CSRF 비활성화
                .csrf(csrf -> csrf.disable())
                // H2 콘솔 UI는 내부적으로 iframe을 사용하므로 X-Frame-Options 비활성화
                .headers(headers -> headers.frameOptions(fo -> fo.disable()))
                .build();
    }
}
