package com.wxxk.aisaas.plan.service;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.plan.entity.Plan;
import com.wxxk.aisaas.plan.enums.PlanType;
import com.wxxk.aisaas.plan.repository.PlanRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanService {

    private final PlanRepository planRepository;

    public Plan getPlanById(UUID id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Plan", id));
    }

    public Plan getPlanByType(PlanType planType) {
        return planRepository.findByPlanType(planType)
                .orElseThrow(() -> new EntityNotFoundException("Plan", "planType", planType.name()));
    }
}
