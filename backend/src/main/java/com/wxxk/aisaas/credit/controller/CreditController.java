package com.wxxk.aisaas.credit.controller;

import com.wxxk.aisaas.credit.dto.TopUpRequest;
import com.wxxk.aisaas.credit.entity.CreditWallet;
import com.wxxk.aisaas.credit.service.CreditWalletService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/credits")
@RequiredArgsConstructor
public class CreditController {

    private final CreditWalletService creditWalletService;

    @GetMapping("/balance")
    public ResponseEntity<Map<String, Object>> getBalance(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        CreditWallet wallet = creditWalletService.getWalletByUserId(userId);
        return ResponseEntity.ok(Map.of(
                "balance", wallet.getBalance(),
                "lifetimeEarned", wallet.getLifetimeEarned(),
                "lifetimeUsed", wallet.getLifetimeUsed()
        ));
    }

    @PostMapping("/top-up")
    public ResponseEntity<Map<String, Object>> topUp(
            @Valid @RequestBody TopUpRequest request, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        creditWalletService.charge(userId, request.amount());
        CreditWallet wallet = creditWalletService.getWalletByUserId(userId);
        return ResponseEntity.ok(Map.of(
                "balance", wallet.getBalance(),
                "lifetimeEarned", wallet.getLifetimeEarned(),
                "lifetimeUsed", wallet.getLifetimeUsed()
        ));
    }
}
