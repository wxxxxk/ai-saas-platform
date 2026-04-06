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
        LocalDateTime createdAt
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
                job.getCreatedAt()
        );
    }
}
