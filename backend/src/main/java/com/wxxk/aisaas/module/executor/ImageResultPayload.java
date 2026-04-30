package com.wxxk.aisaas.module.executor;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;

/**
 * IMAGE_GENERATION outputPayload JSON envelope 빌더.
 * 직렬화 실패 시 raw URL로 fallback한다.
 */
@Slf4j
final class ImageResultPayload {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ImageResultPayload() {}

    /**
     * @param url       저장된 이미지 URL (Supabase 영구 URL 또는 OpenAI 임시 URL)
     * @param jobId     job ID (meta.jobId)
     * @param permanent Supabase 업로드 성공 여부
     * @return JSON 문자열 — 직렬화 실패 시 url 원본 반환
     */
    static String toJson(String url, String jobId, boolean permanent) {
        try {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("url", url);
            data.put("provider", "openai");
            data.put("model", "dall-e-3");
            data.put("permanent", permanent);

            Map<String, Object> meta = new LinkedHashMap<>();
            meta.put("jobId", jobId);
            meta.put("createdAt", Instant.now().toString());

            Map<String, Object> envelope = new LinkedHashMap<>();
            envelope.put("version", 1);
            envelope.put("type", "image");
            envelope.put("data", data);
            envelope.put("meta", meta);

            return MAPPER.writeValueAsString(envelope);
        } catch (Exception e) {
            log.warn("[ImageResultPayload] JSON 직렬화 실패 — raw URL fallback: jobId={} error={}", jobId, e.getMessage());
            return url;
        }
    }
}
