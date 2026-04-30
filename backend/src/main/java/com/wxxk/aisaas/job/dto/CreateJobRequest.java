package com.wxxk.aisaas.job.dto;

import com.wxxk.aisaas.module.enums.AiProvider;
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

    /**
     * 사용할 AI 공급자. null이면 모듈의 defaultProvider를 사용한다.
     * 유효값: "OPENAI", "GEMINI", "CLAUDE", "STABILITY_AI"
     * 프론트엔드는 이 필드를 보내지 않아도 되며, 기존 동작은 그대로 유지된다.
     */
    private AiProvider provider;

    /**
     * 이 Job 완료 후 자동으로 실행할 다음 모듈 이름 (선택).
     * 예: "IMAGE_GENERATION" — TEXT_GENERATION 결과를 입력으로 이미지 생성 Job을 연결한다.
     * null이면 단일 Job으로 종료된다.
     */
    private String nextModuleName;
}
