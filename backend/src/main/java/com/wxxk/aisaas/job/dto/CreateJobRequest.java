package com.wxxk.aisaas.job.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateJobRequest {

    @NotNull
    private UUID moduleId;

    private String inputPayload;
}
