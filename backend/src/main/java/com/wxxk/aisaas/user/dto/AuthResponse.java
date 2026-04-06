package com.wxxk.aisaas.user.dto;

import java.util.UUID;

public record AuthResponse(
        String token,
        UUID userId,
        String email,
        String name,
        int balance
) {}
