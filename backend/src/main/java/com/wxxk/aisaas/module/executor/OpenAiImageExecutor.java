package com.wxxk.aisaas.module.executor;

import com.wxxk.aisaas.asset.service.AssetService;
import com.wxxk.aisaas.job.entity.Job;
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

    @Override
    public String moduleName() {
        return "IMAGE_GENERATION";
    }

    @Override
    public void execute(Job job) {
        job.start();
        log.info("IMAGE_GENERATION started: jobId={} prompt=\"{}\"",
                job.getId(), job.getInputPayload());
        try {
            String imageUrl = callDallE(job.getInputPayload());
            log.info("IMAGE_GENERATION: received URL jobId={} urlLength={}",
                    job.getId(), imageUrl.length());

            job.complete(imageUrl);

            assetService.saveAsset(
                    job.getId(),
                    job.getUser().getId(),
                    "generated-image.png",
                    "image/png",
                    imageUrl,
                    0L
            );
            log.info("IMAGE_GENERATION: asset saved successfully jobId={}", job.getId());
        } catch (Exception e) {
            log.error("IMAGE_GENERATION failed: jobId={} error={}", job.getId(), e.getMessage(), e);
            job.fail(e.getMessage());
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
