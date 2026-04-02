package com.wxxk.aisaas.module.service;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.repository.AiModuleRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiModuleService {

    private final AiModuleRepository aiModuleRepository;

    public List<AiModule> getActiveModules() {
        return aiModuleRepository.findAllByActiveTrue();
    }

    public AiModule getModuleById(UUID id) {
        return aiModuleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AiModule", id));
    }

    public AiModule getModuleByName(String name) {
        return aiModuleRepository.findByName(name)
                .orElseThrow(() -> new EntityNotFoundException("AiModule", "name", name));
    }
}
