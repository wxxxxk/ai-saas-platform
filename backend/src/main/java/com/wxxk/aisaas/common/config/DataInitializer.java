package com.wxxk.aisaas.common.config;

import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.repository.AiModuleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!prod")
public class DataInitializer implements ApplicationRunner {

    // BaseEntity.id는 @GeneratedValue(UUID)로 JPA가 자동 생성하며 setter가 없다.
    // 프론트엔드 TEMP_USER_ID와 일치시키려면 고정 UUID가 필요하므로 JdbcTemplate으로 직접 INSERT한다.
    static final String DEV_USER_ID   = "00000000-0000-0000-0000-000000000001";
    static final String DEV_WALLET_ID = "00000000-0000-0000-0000-000000000002";

    private final AiModuleRepository aiModuleRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (aiModuleRepository.count() > 0) {
            log.info("DataInitializer: data already exists, skipping.");
            return;
        }

        seedDevUser();
        seedAiModules();
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

    private void seedAiModules() {
        List<AiModule> modules = List.of(
                AiModule.builder()
                        .name("TEXT_GENERATION")
                        .description("주어진 프롬프트를 기반으로 텍스트를 생성합니다.")
                        .creditCostPerCall(10)
                        .active(true)
                        .build(),
                AiModule.builder()
                        .name("SUMMARIZATION")
                        .description("긴 문서나 텍스트를 간결하게 요약합니다.")
                        .creditCostPerCall(5)
                        .active(true)
                        .build(),
                AiModule.builder()
                        .name("IMAGE_GENERATION")
                        .description("텍스트 설명을 기반으로 이미지를 생성합니다.")
                        .creditCostPerCall(30)
                        .active(true)
                        .build(),
                AiModule.builder()
                        .name("TRANSLATION")
                        .description("텍스트를 지정한 언어로 번역합니다.")
                        .creditCostPerCall(3)
                        .active(false)
                        .build()
        );

        aiModuleRepository.saveAll(modules);
        log.info("DataInitializer: Inserted {} AiModule records.", modules.size());
    }
}
