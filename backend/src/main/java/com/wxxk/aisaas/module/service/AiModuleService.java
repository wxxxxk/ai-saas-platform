package com.wxxk.aisaas.module.service;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.executor.AiModuleExecutor;
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
    private final List<AiModuleExecutor> executors;

    public List<AiModule> getActiveModules() {
        return aiModuleRepository.findAllByActiveTrue();
    }

    /**
     * 등록된 executor 목록에서 해당 모듈이 지원하는 공급자 이름을 반환한다.
     * 결과는 알파벳 순으로 정렬되어 일관된 UI 순서를 보장한다.
     * executor가 없는 모듈은 빈 리스트를 반환한다.
     */
    public List<String> getSupportedProviders(String moduleName) {
        return executors.stream()
                .filter(e -> e.moduleName().equals(moduleName))
                .map(e -> e.provider().name())
                .sorted()
                .toList();
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
