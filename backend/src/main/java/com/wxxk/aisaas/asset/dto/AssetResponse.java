package com.wxxk.aisaas.asset.dto;

import com.wxxk.aisaas.asset.entity.Asset;
import java.time.LocalDateTime;
import java.util.UUID;

public record AssetResponse(
        UUID id,
        UUID jobId,
        String fileName,
        String fileType,
        String storageKey,
        long fileSizeBytes,
        LocalDateTime createdAt
) {
    public static AssetResponse from(Asset asset) {
        return new AssetResponse(
                asset.getId(),
                asset.getJob().getId(),
                asset.getFileName(),
                asset.getFileType(),
                asset.getStorageKey(),
                asset.getFileSizeBytes(),
                asset.getCreatedAt()
        );
    }
}
