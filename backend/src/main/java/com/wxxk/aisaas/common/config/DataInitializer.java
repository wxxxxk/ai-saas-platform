package com.wxxk.aisaas.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!prod")
@Order(2)  // AiModuleInitializer(Order=1) 이후에 실행
public class DataInitializer implements ApplicationRunner {

    // BaseEntity.id는 @GeneratedValue(UUID)로 JPA가 자동 생성하며 setter가 없다.
    // dev 환경에서 재기동 시에도 동일한 사용자로 테스트할 수 있도록 고정 UUID를 사용해 JdbcTemplate으로 직접 INSERT한다.
    static final String DEV_USER_ID   = "00000000-0000-0000-0000-000000000001";
    static final String DEV_WALLET_ID = "00000000-0000-0000-0000-000000000002";

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE id = ?", Integer.class, DEV_USER_ID);
        if (count != null && count > 0) {
            log.info("DataInitializer: dev user already exists, skipping.");
            return;
        }

        seedDevUser();
    }

    private void seedDevUser() {

        jdbcTemplate.update("""
                INSERT INTO users
                    (id, email, password_hash, name, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                """,
                DEV_USER_ID,
                "dev@example.com",
                passwordEncoder.encode("devpassword"),  // 로그인: dev@example.com / devpassword
                "Dev User",
                "USER",
                "ACTIVE"
        );

        jdbcTemplate.update("""
                INSERT INTO credit_wallets
                    (id, user_id, balance, lifetime_earned, lifetime_used, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                """,
                DEV_WALLET_ID,
                DEV_USER_ID,
                1000,   // 개발용 초기 크레딧 잔액
                1000,
                0
        );

        log.info("DataInitializer: Dev user inserted (id={}, balance=1000).", DEV_USER_ID);
    }


}
