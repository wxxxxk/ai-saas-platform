package com.wxxk.aisaas.plan.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import com.wxxk.aisaas.plan.enums.PlanType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "plans")
public class Plan extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private PlanType planType;

    @Column(nullable = false)
    private String name;

    // 매월 자동 지급되는 크레딧 (FREE=0 가능)
    @Column(nullable = false)
    private Integer monthlyCredits;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerMonth;

    @Builder
    private Plan(PlanType planType, String name, Integer monthlyCredits, BigDecimal pricePerMonth) {
        this.planType = planType;
        this.name = name;
        this.monthlyCredits = monthlyCredits;
        this.pricePerMonth = pricePerMonth;
    }
}
