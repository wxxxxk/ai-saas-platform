package com.wxxk.aisaas.asset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateAssetRequest {

    @NotNull
    private UUID userId;

    @NotBlank
    private String fileName;

    @NotBlank
    private String fileType;

    @NotNull
    @Positive
    private Long fileSizeBytes;
}
