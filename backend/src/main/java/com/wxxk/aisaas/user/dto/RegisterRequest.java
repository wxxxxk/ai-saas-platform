package com.wxxk.aisaas.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6, message = "비밀번호는 최소 6자 이상이어야 합니다.") String password,
        @NotBlank String name
) {}
