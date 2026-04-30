package com.wxxk.aisaas.job.dto;

import com.wxxk.aisaas.job.entity.Job;
import java.time.LocalDateTime;
import java.util.UUID;

public record JobResponse(
        UUID id,
        UUID userId,
        UUID moduleId,
        String moduleName,
        String status,
        int creditUsed,
        String inputPayload,
        String outputPayload,
        String errorMessage,
        LocalDateTime createdAt,
        String provider,        // AI 공급자 이름 (예: "OPENAI")
        UUID parentJobId,       // pipeline: 이 Job을 트리거한 부모 Job ID (없으면 null)
        String nextModuleName   // pipeline: 완료 후 실행될 다음 모듈 이름 (없으면 null)
) {
    public static JobResponse from(Job job) {
        return new JobResponse(
                job.getId(),
                job.getUser().getId(),
                job.getModule().getId(),
                job.getModule().getName(),
                job.getStatus().name(),
                job.getCreditUsed(),
                job.getInputPayload(),
                job.getOutputPayload(),
                job.getErrorMessage(),
                job.getCreatedAt(),
                job.getProvider().name(),
                job.getParentJobId(),
                job.getNextModuleName()
        );
    }
}
