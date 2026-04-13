package com.wxxk.aisaas.credit.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import com.wxxk.aisaas.common.exception.InsufficientCreditException;
import com.wxxk.aisaas.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    @Builder
    private CreditWallet(User user, Integer balance, Integer lifetimeEarned, Integer lifetimeUsed) {
        this.user = user;
        this.balance = balance;
        this.lifetimeEarned = lifetimeEarned;
        this.lifetimeUsed = lifetimeUsed;
    }

    public void charge(int amount) {
        this.balance += amount;
        this.lifetimeEarned += amount;
    }

    public void deduct(int amount) {
        if (this.balance < amount) {
            throw new InsufficientCreditException(this.balance, amount);
        }
        this.balance -= amount;
        this.lifetimeUsed += amount;
    }

    /**
     * Job 실패 시 차감된 크레딧을 되돌린다.
     * charge()와 달리 lifetimeEarned는 증가시키지 않고 lifetimeUsed를 복구한다.
     * (실제로 AI 작업이 수행되지 않았으므로 사용 이력에서도 제거)
     */
    public void refund(int amount) {
        this.balance += amount;
        this.lifetimeUsed = Math.max(0, this.lifetimeUsed - amount);
    }
}
