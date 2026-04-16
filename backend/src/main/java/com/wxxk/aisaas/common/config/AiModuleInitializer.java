package com.wxxk.aisaas.common.config;

import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.enums.AiProvider;
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

    // 모듈 정의 레코드: name, description, creditCostPerCall, active, defaultProvider
    private record ModuleDef(String name, String description, int cost, boolean active,
                             AiProvider defaultProvider) {}

    private static final List<ModuleDef> MODULE_DEFINITIONS = List.of(
            new ModuleDef("TEXT_GENERATION",  "주어진 프롬프트를 기반으로 텍스트를 생성합니다.", 10, true,  AiProvider.OPENAI),
            new ModuleDef("SUMMARIZATION",    "긴 문서나 텍스트를 간결하게 요약합니다.",        5,  false, AiProvider.OPENAI), // executor 미구현
            new ModuleDef("IMAGE_GENERATION", "텍스트 설명을 기반으로 이미지를 생성합니다.",    30, true,  AiProvider.OPENAI),
            new ModuleDef("TRANSLATION",      "텍스트를 지정한 언어로 번역합니다.",             3,  false, AiProvider.OPENAI)  // executor 미구현
    );

    /**
     * Upsert 방식으로 실행한다.
     * - 레코드가 없으면 INSERT
     * - 레코드가 있으면 active / defaultProvider 를 정의와 동기화한다.
     *   (배포 시 이 파일만 수정하면 다음 재기동 시 자동 반영된다)
     */
    @Override
    public void run(ApplicationArguments args) {
        int inserted = 0;
        int updated = 0;

        for (ModuleDef def : MODULE_DEFINITIONS) {
            var existing = aiModuleRepository.findByName(def.name());
            if (existing.isEmpty()) {
                aiModuleRepository.save(AiModule.builder()
                        .name(def.name())
                        .description(def.description())
                        .creditCostPerCall(def.cost())
                        .active(def.active())
                        .defaultProvider(def.defaultProvider())
                        .build());
                inserted++;
            } else {
                AiModule module = existing.get();
                boolean changed = false;

                if (module.isActive() != def.active()) {
                    module.updateActive(def.active());
                    changed = true;
                }
                // defaultProvider 가 null (컬럼 추가 이전 행) 이거나 정의와 다른 경우 동기화
                if (module.getDefaultProvider() == null
                        || module.getDefaultProvider() != def.defaultProvider()) {
                    module.updateDefaultProvider(def.defaultProvider());
                    changed = true;
                }
                if (changed) {
                    updated++;
                    log.info("AiModuleInitializer: updated {} active={} defaultProvider={}",
                            def.name(), def.active(), def.defaultProvider());
                }
            }
        }

        log.info("AiModuleInitializer: inserted={} updated={}", inserted, updated);
    }
}
