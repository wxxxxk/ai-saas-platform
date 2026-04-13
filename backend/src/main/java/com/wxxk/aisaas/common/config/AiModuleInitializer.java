package com.wxxk.aisaas.common.config;

import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.repository.AiModuleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * AiModule 기초 데이터를 모든 프로필에서 보장한다.
 * dev: DataInitializer 보다 먼저 실행되어 모듈 레코드를 확보한다.
 * prod: DataInitializer 가 비활성화되므로 이 클래스가 유일한 시드 진입점이다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(1)
public class AiModuleInitializer implements ApplicationRunner {

    private final AiModuleRepository aiModuleRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (aiModuleRepository.count() > 0) {
            log.info("AiModuleInitializer: modules already exist, skipping.");
            return;
        }

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
        log.info("AiModuleInitializer: inserted {} AiModule records.", modules.size());
    }
}
