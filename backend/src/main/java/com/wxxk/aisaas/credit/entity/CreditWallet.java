package com.wxxk.aisaas.credit.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import com.wxxk.aisaas.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;

@Getter
@Entity
@Table(name = "credit_wallets")
public class CreditWallet extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Integer balance;

    // 누적 충전량 (플랜 지급 + 수동 충전 합산)
    @Column(nullable = false)
    private Integer lifetimeEarned;

    // 누적 사용량 (Job 실행 시 차감 합산)
    @Column(nullable = false)
    private Integer lifetimeUsed;
}
