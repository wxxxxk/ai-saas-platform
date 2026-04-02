package com.wxxk.aisaas.credit.repository;

import com.wxxk.aisaas.credit.entity.CreditWallet;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditWalletRepository extends JpaRepository<CreditWallet, UUID> {

    Optional<CreditWallet> findByUserId(UUID userId);
}
