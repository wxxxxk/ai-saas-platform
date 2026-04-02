package com.wxxk.aisaas.plan.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import com.wxxk.aisaas.plan.enums.PlanType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;

@Getter
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
}
