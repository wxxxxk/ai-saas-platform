package com.wxxk.aisaas.user.controller;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.common.security.JwtUtil;
import com.wxxk.aisaas.credit.entity.CreditWallet;
import com.wxxk.aisaas.credit.service.CreditWalletService;
import com.wxxk.aisaas.user.dto.AuthResponse;
import com.wxxk.aisaas.user.dto.LoginRequest;
import com.wxxk.aisaas.user.dto.MeResponse;
import com.wxxk.aisaas.user.dto.RegisterRequest;
import com.wxxk.aisaas.user.entity.User;
import com.wxxk.aisaas.user.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final int WELCOME_CREDITS = 100;

    private final UserService userService;
    private final CreditWalletService creditWalletService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("[AuthController] register reached — email={}", request.email());
        User user = userService.register(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.name()
        );
        creditWalletService.charge(user.getId(), WELCOME_CREDITS);
        CreditWallet wallet = creditWalletService.getWalletByUserId(user.getId());
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getName(), user.getRole().name());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), wallet.getBalance()));
    }

    /**
     * 현재 인증된 사용자의 프로필 + 크레딧 잔액을 반환한다.
     * JwtAuthFilter가 SecurityContext에 설정한 Authentication에서 userId를 꺼낸다.
     * 이 엔드포인트는 SecurityConfig에서 authenticated()로 보호되어야 한다
     * (/api/auth/** permitAll 범위에서 제외).
     */
    @GetMapping("/me")
    public ResponseEntity<MeResponse> getMe(Authentication auth) {
        // JwtAuthFilter: auth.getName() == JWT subject == userId (UUID 문자열)
        UUID userId = UUID.fromString(auth.getName());
        // plan LAZY 로딩 대비 JOIN FETCH 쿼리 사용
        User user = userService.getUserWithPlan(userId);
        CreditWallet wallet = creditWalletService.getWalletByUserId(userId);
        return ResponseEntity.ok(new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                user.getPlan() != null ? user.getPlan().getPlanType().name() : null,
                wallet.getBalance()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("[AuthController] login attempt — email={}", request.email());
        User user;
        try {
            user = userService.getUserByEmail(request.email());
            log.info("[AuthController] user found — userId={}", user.getId());
        } catch (EntityNotFoundException e) {
            log.warn("[AuthController] user not found — email={}", request.email());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        boolean passwordMatch = passwordEncoder.matches(request.password(), user.getPasswordHash());
        log.debug("[AuthController] password match={}", passwordMatch);
        if (!passwordMatch) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        CreditWallet wallet = creditWalletService.getWalletByUserId(user.getId());
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getName(), user.getRole().name());
        return ResponseEntity.ok(
                new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), wallet.getBalance()));
    }
}
