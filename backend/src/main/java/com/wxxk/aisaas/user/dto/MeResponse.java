package com.wxxk.aisaas.user.dto;

import java.util.UUID;

/**
 * GET /api/auth/me 응답 DTO.
 * 현재 인증된 사용자의 프로필 + 크레딧 잔액을 하나의 응답으로 묶어 반환한다.
 * 프론트에서 대시보드 진입 시 한 번의 API 호출로 사용자 상태를 복원할 수 있다.
 */
public record MeResponse(
        UUID id,
        String email,
        String name,
        String role,
        String plan,          // 플랜 미가입 시 null
        int creditBalance
) {}
