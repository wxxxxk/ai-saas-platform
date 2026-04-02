package com.wxxk.aisaas.module.repository;

import com.wxxk.aisaas.module.entity.AiModule;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiModuleRepository extends JpaRepository<AiModule, UUID> {

    List<AiModule> findAllByActiveTrue();

    Optional<AiModule> findByName(String name);
}
