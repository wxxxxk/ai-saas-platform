package com.wxxk.aisaas.job.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateJobRequest {

    @NotNull
    private UUID moduleId;

    @NotBlank(message = "프롬프트를 입력해 주세요.")
    @Size(max = 4000, message = "프롬프트는 최대 4,000자까지 입력할 수 있습니다.")
    private String inputPayload;
}
