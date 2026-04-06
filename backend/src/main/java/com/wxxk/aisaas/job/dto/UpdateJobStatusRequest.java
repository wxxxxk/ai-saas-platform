package com.wxxk.aisaas.job.dto;

import lombok.Data;

@Data
public class UpdateJobStatusRequest {

    // COMPLETED 전이 시 AI 출력 결과 (선택)
    private String outputPayload;

    // FAILED 전이 시 오류 메시지 (선택)
    private String errorMessage;
}
