package com.wxxk.aisaas.module.controller;

import com.wxxk.aisaas.module.dto.AiModuleResponse;
import com.wxxk.aisaas.module.service.AiModuleService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/modules")
@RequiredArgsConstructor
public class AiModuleController {

    private final AiModuleService aiModuleService;

    @GetMapping
    public ResponseEntity<List<AiModuleResponse>> getActiveModules() {
        List<AiModuleResponse> response = aiModuleService.getActiveModules()
                .stream()
                .map(m -> AiModuleResponse.from(m, aiModuleService.getSupportedProviders(m.getName())))
                .toList();
        return ResponseEntity.ok(response);
    }
}
