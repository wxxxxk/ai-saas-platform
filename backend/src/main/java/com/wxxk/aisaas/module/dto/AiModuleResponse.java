package com.wxxk.aisaas.module.dto;

import com.wxxk.aisaas.module.entity.AiModule;
import java.util.UUID;

public record AiModuleResponse(
        UUID id,
        String name,
        String description,
        int creditCostPerCall,
        boolean active
) {
    public static AiModuleResponse from(AiModule module) {
        return new AiModuleResponse(
                module.getId(),
                module.getName(),
                module.getDescription(),
                module.getCreditCostPerCall(),
                module.isActive()
        );
    }
}
