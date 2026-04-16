package com.wxxk.aisaas.module.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import com.wxxk.aisaas.module.enums.AiProvider;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    // 이 모듈의 기본 AI 공급자.
    // request에 provider가 명시되지 않으면 이 값을 사용한다.
    // columnDefinition: ddl-auto=update 시 기존 행에 DEFAULT 'OPENAI' 가 적용된다.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'OPENAI'")
    private AiProvider defaultProvider;

    @Builder
    private AiModule(String name, String description, Integer creditCostPerCall,
                     boolean active, AiProvider defaultProvider) {
        this.name = name;
        this.description = description;
        this.creditCostPerCall = creditCostPerCall;
        this.active = active;
        this.defaultProvider = defaultProvider != null ? defaultProvider : AiProvider.OPENAI;
    }

    public void updateActive(boolean active) {
        this.active = active;
    }

    public void updateDefaultProvider(AiProvider defaultProvider) {
        this.defaultProvider = defaultProvider;
    }
}
