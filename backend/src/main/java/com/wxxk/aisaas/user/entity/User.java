package com.wxxk.aisaas.user.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import com.wxxk.aisaas.plan.entity.Plan;
import com.wxxk.aisaas.user.enums.UserRole;
import com.wxxk.aisaas.user.enums.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "users")
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    // nullable: 미구독 상태(Plan 없음) 허용
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;
}
