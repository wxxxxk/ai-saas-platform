package com.wxxk.aisaas.module.executor;

import com.wxxk.aisaas.asset.service.AssetService;
import com.wxxk.aisaas.job.entity.Job;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiImageExecutor implements AiModuleExecutor {

    private static final String OPENAI_URL = "https://api.openai.com/v1/images/generations";
    private static final String MODEL = "dall-e-3";
    private static final String SIZE = "1024x1024";

    private final AssetService assetService;

    @Value("${openai.api.key}")
    private String apiKey;

    private final RestClient restClient = RestClient.create();

    @PostConstruct
    void logKeyStatus() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[IMAGE_GENERATION] openai.api.key is BLANK — OPENAI_API_KEY 환경변수를 확인하세요");
        } else {
            String masked = apiKey.substring(0, Math.min(5, apiKey.length())) + "*** (length=" + apiKey.length() + ")";
            log.info("[IMAGE_GENERATION] openai.api.key loaded: {}", masked);
        }
    }

    @Override
    public String moduleName() {
        return "IMAGE_GENERATION";
    }

    @Override
    public void execute(Job job) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("[IMAGE_GENERATION] apiKey is blank at execute time (jobId={}) — 기동 로그에서 key 상태를 확인하세요", job.getId());
            job.fail("OPENAI_API_KEY가 설정되지 않았습니다. 환경변수를 확인하세요.");
            return;
        }
        job.start();
        log.info("[IMAGE_GENERATION] started: jobId={} prompt=\"{}\"", job.getId(), job.getInputPayload());

        // 1단계: DALL-E 호출 — 실패하면 job.fail() 후 즉시 종료
        String imageUrl;
        try {
            imageUrl = callDallE(job.getInputPayload());
            log.info("[IMAGE_GENERATION] received URL: jobId={} urlLength={}", job.getId(), imageUrl.length());
        } catch (Exception e) {
            log.error("[IMAGE_GENERATION] failed: jobId={} error={}", job.getId(), e.getMessage(), e);
            job.fail(e.getMessage());
            return;
        }

        // 2단계: OpenAI 성공 → outputPayload에 imageUrl 저장, COMPLETED 확정
        // outputPayload에 URL을 저장해 두므로 asset 저장 실패와 무관하게 이미지 표시 가능
        job.complete(imageUrl);

        // 3단계: Asset 저장 — 실패해도 job은 COMPLETED 유지 (outputPayload에 URL이 있으므로)
        try {
            assetService.saveAsset(
                    job.getId(),
                    job.getUser().getId(),
                    "generated-image.png",
                    "image/png",
                    imageUrl,
                    0L
            );
            log.info("[IMAGE_GENERATION] asset saved successfully: jobId={}", job.getId());
        } catch (Exception e) {
            log.warn("[IMAGE_GENERATION] asset save failed for job {} (job stays COMPLETED): {}", job.getId(), e.getMessage());
        }
    }

    private String callDallE(String prompt) throws IOException {
        var body = Map.of(
                "model", MODEL,
                "prompt", prompt != null ? prompt : "",
                "n", 1,
                "size", SIZE
        );

        DallEResponse response = restClient.post()
                .uri(OPENAI_URL)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    String rawBody = StreamUtils.copyToString(res.getBody(), StandardCharsets.UTF_8);
                    log.error("OpenAI DALL-E API error: status={} body={}", res.getStatusCode(), rawBody);
                    throw new RuntimeException(resolveUserMessage(rawBody));
                })
                .body(DallEResponse.class);

        return response.data().get(0).url();
    }

    /**
     * OpenAI 에러 응답 body에서 error code를 string 매칭으로 확인하고
     * 사용자 친화적 메시지를 반환한다. Jackson 의존 없이 동작한다.
     */
    private String resolveUserMessage(String rawBody) {
        if (rawBody == null) {
            return "이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("content_policy_violation")) {
            return "프롬프트가 이미지 생성 안전 정책에 의해 거절되었습니다. " +
                   "실존 인물·노골적 표현·폭력적·민감한 묘사를 피하고 다시 시도해 주세요.";
        }
        if (rawBody.contains("billing_hard_limit_reached")) {
            return "API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("rate_limit_exceeded")) {
            return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("invalid_api_key")) {
            return "API 키 설정 오류입니다. 관리자에게 문의하세요.";
        }
        return "이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    private record DallEResponse(List<ImageData> data) {}
    private record ImageData(String url) {}
}
