package com.wxxk.aisaas.module.executor;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

/**
 * TEXT_GENERATION outputPayload JSON envelope 빌더.
 * 직렬화 실패 시 raw content로 fallback한다.
 */
@Slf4j
final class TextResultPayload {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private TextResultPayload() {}

    /**
     * @param content  AI가 생성한 텍스트 본문
     * @param jobId    job ID (meta.jobId)
     * @param provider AI 공급자 식별자 (예: "openai", "gemini", "claude")
     * @param model    사용한 모델 이름 (예: "gpt-4o-mini")
     * @return JSON 문자열 — 직렬화 실패 시 content 원본 반환
     */
    static String toJson(String content, String jobId, String provider, String model) {
        try {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("content", content);
            data.put("provider", provider);
            data.put("model", model);

            Map<String, Object> meta = new LinkedHashMap<>();
            meta.put("jobId", jobId);
            meta.put("createdAt", Instant.now().toString());

            Map<String, Object> envelope = new LinkedHashMap<>();
            envelope.put("version", 1);
            envelope.put("type", "text");
            envelope.put("data", data);
            envelope.put("meta", meta);

            return MAPPER.writeValueAsString(envelope);
        } catch (Exception e) {
            log.warn("[TextResultPayload] JSON 직렬화 실패 — raw content fallback: jobId={} error={}", jobId, e.getMessage());
            return content;
        }
    }
}
