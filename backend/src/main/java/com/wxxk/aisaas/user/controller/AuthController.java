package com.wxxk.aisaas.user.controller;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.common.security.JwtUtil;
import com.wxxk.aisaas.credit.entity.CreditWallet;
import com.wxxk.aisaas.credit.service.CreditWalletService;
import com.wxxk.aisaas.user.dto.AuthResponse;
import com.wxxk.aisaas.user.dto.LoginRequest;
import com.wxxk.aisaas.user.dto.RegisterRequest;
import com.wxxk.aisaas.user.entity.User;
import com.wxxk.aisaas.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        User user = userService.register(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.name()
        );
        creditWalletService.charge(user.getId(), WELCOME_CREDITS);
        CreditWallet wallet = creditWalletService.getWalletByUserId(user.getId());
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), wallet.getBalance()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user;
        try {
            user = userService.getUserByEmail(request.email());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        CreditWallet wallet = creditWalletService.getWalletByUserId(user.getId());
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getName());
        return ResponseEntity.ok(
                new AuthResponse(token, user.getId(), user.getEmail(), user.getName(), wallet.getBalance()));
    }
}
