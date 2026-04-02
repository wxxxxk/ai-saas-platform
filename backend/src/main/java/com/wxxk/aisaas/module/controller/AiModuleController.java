package com.wxxk.aisaas.module.controller;

import com.wxxk.aisaas.module.entity.AiModule;
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
    public ResponseEntity<List<AiModule>> getActiveModules() {
        return ResponseEntity.ok(aiModuleService.getActiveModules());
    }
}
