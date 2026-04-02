package com.wxxk.aisaas.module.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "ai_modules")
public class AiModule extends BaseEntity {

    // AI 기능 식별자 (예: TEXT_GENERATION, IMAGE_GENERATION)
    @Column(nullable = false, unique = true)
    private String name;

    @Column
    private String description;

    // Job 1회 실행 시 차감되는 크레딧
    @Column(nullable = false)
    private Integer creditCostPerCall;

    // false이면 해당 모듈로 Job 생성 불가
    @Column(nullable = false)
    private boolean active;
}
