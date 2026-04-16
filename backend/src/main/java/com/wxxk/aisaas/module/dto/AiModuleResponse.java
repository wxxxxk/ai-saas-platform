package com.wxxk.aisaas.module.dto;

import com.wxxk.aisaas.module.entity.AiModule;
import java.util.List;
import java.util.UUID;

public record AiModuleResponse(
        UUID id,
        String name,
        String description,
        int creditCostPerCall,
        boolean active,
        List<String> supportedProviders   // 등록된 executor 기준 — 프론트엔드 provider 선택 UI에 사용
) {
    public static AiModuleResponse from(AiModule module, List<String> supportedProviders) {
        return new AiModuleResponse(
                module.getId(),
                module.getName(),
                module.getDescription(),
                module.getCreditCostPerCall(),
                module.isActive(),
                supportedProviders
        );
    }
}
