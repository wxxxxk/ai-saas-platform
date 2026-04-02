package com.wxxk.aisaas.job.dto;

import com.wxxk.aisaas.job.entity.Job;
import java.time.LocalDateTime;
import java.util.UUID;

public record JobResponse(
        UUID id,
        UUID userId,
        UUID moduleId,
        String status,
        int creditUsed,
        LocalDateTime createdAt
) {
    public static JobResponse from(Job job) {
        return new JobResponse(
                job.getId(),
                job.getUser().getId(),
                job.getModule().getId(),
                job.getStatus().name(),
                job.getCreditUsed(),
                job.getCreatedAt()
        );
    }
}
