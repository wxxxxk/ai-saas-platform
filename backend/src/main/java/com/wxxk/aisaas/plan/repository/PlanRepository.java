package com.wxxk.aisaas.plan.repository;

import com.wxxk.aisaas.plan.entity.Plan;
import com.wxxk.aisaas.plan.enums.PlanType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanRepository extends JpaRepository<Plan, UUID> {

    Optional<Plan> findByPlanType(PlanType planType);
}
