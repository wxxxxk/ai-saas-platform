package com.wxxk.aisaas.credit.service;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.credit.entity.CreditWallet;
import com.wxxk.aisaas.credit.repository.CreditWalletRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreditWalletService {

    private final CreditWalletRepository creditWalletRepository;

    @Transactional(readOnly = true)
    public CreditWallet getWalletByUserId(UUID userId) {
        return creditWalletRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("CreditWallet", "userId", userId.toString()));
    }

    // 잔액 확인 + 차감을 하나의 트랜잭션으로 처리
    // InsufficientCreditException은 CreditWallet.deduct() 내부에서 발생
    @Transactional
    public void deduct(UUID userId, int amount) {
        CreditWallet wallet = getWalletByUserId(userId);
        wallet.deduct(amount);
    }

    @Transactional
    public void charge(UUID userId, int amount) {
        CreditWallet wallet = getWalletByUserId(userId);
        wallet.charge(amount);
    }

    /**
     * Job 실패 시 크레딧 환불.
     * 차감된 금액을 balance에 복구하고 lifetimeUsed도 되돌린다.
     */
    @Transactional
    public void refund(UUID userId, int amount) {
        CreditWallet wallet = getWalletByUserId(userId);
        wallet.refund(amount);
    }
}
