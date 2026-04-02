package com.wxxk.aisaas.common.config;

import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.repository.AiModuleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!prod")  // prod 프로파일에서는 실행하지 않음
public class DataInitializer implements ApplicationRunner {

    private final AiModuleRepository aiModuleRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (aiModuleRepository.count() > 0) {
            log.info("DataInitializer: AiModule data already exists, skipping.");
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
        log.info("DataInitializer: Inserted {} AiModule records.", modules.size());
    }
}
