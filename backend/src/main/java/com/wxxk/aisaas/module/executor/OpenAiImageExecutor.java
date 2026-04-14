package com.wxxk.aisaas.module.executor;

import com.wxxk.aisaas.asset.service.AssetService;
import com.wxxk.aisaas.common.storage.SupabaseStorageService;
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
    private final SupabaseStorageService storageService;

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
            log.error("[IMAGE_GENERATION] apiKey is blank — jobId={}", job.getId());
            job.fail("OPENAI_API_KEY가 설정되지 않았습니다. 환경변수를 확인하세요.");
            return;
        }
        job.start();
        log.info("[IMAGE_GENERATION] started: jobId={} prompt=\"{}\"", job.getId(), job.getInputPayload());

        // 1단계: DALL-E 호출 — 실패하면 job.fail() 후 즉시 종료
        // 반환값은 Azure Blob SAS URL (~1시간 TTL 임시 URL)
        String tempUrl;
        try {
            tempUrl = callDallE(job.getInputPayload());
            log.info("[IMAGE_GENERATION] received temp URL: jobId={}", job.getId());
        } catch (Exception e) {
            log.error("[IMAGE_GENERATION] DALL-E call failed: jobId={} error={}", job.getId(), e.getMessage(), e);
            job.fail(e.getMessage());
            return;
        }

        // 2단계: 이미지 다운로드 → Supabase 영구 저장
        // Supabase가 설정된 경우: 바이너리를 내려받아 영구 저장 → 영구 URL을 outputPayload에 기록
        // Supabase 미설정: 임시 URL을 그대로 저장 (약 1시간 후 만료됨을 로그로 경고)
        if (storageService.isConfigured()) {
            uploadToStorage(job, tempUrl);
        } else {
            log.warn("[IMAGE_GENERATION] Supabase 미설정 — 임시 URL 저장 (약 1시간 후 만료): jobId={}", job.getId());
            completeWithUrl(job, tempUrl, 0L);
        }
    }

    /**
     * OpenAI 임시 URL에서 이미지를 다운로드해 Supabase에 업로드하고
     * 영구 URL로 Job을 COMPLETED 처리한다.
     * 업로드 실패 시 임시 URL로 fallback한다.
     */
    private void uploadToStorage(Job job, String tempUrl) {
        try {
            // 2-1: OpenAI CDN에서 이미지 바이너리 다운로드
            byte[] imageBytes = downloadImage(tempUrl);
            log.info("[IMAGE_GENERATION] image downloaded: jobId={} size={}bytes", job.getId(), imageBytes.length);

            // 2-2: Supabase에 업로드 → 영구 공개 URL 반환
            String permanentUrl = storageService.uploadImage(job.getId(), imageBytes);

            // 2-3: 영구 URL로 COMPLETED 처리
            completeWithUrl(job, permanentUrl, (long) imageBytes.length);

        } catch (Exception e) {
            log.warn("[IMAGE_GENERATION] Supabase 업로드 실패 — 임시 URL로 fallback: jobId={} error={}",
                    job.getId(), e.getMessage());
            completeWithUrl(job, tempUrl, 0L);
        }
    }

    /**
     * Job을 COMPLETED로 처리하고 asset을 저장한다.
     * storageKey: Supabase 경로 ("images/{jobId}.png") 또는 임시 URL
     */
    private void completeWithUrl(Job job, String outputUrl, long sizeBytes) {
        job.complete(outputUrl);

        String storageKey = outputUrl.contains("supabase.co")
                ? "images/" + job.getId() + ".png"
                : outputUrl;

        try {
            assetService.saveAsset(
                    job.getId(),
                    job.getUser().getId(),
                    "generated-image.png",
                    "image/png",
                    storageKey,
                    sizeBytes
            );
            log.info("[IMAGE_GENERATION] completed: jobId={} permanent={}", job.getId(), !outputUrl.equals(storageKey));
        } catch (Exception e) {
            log.warn("[IMAGE_GENERATION] asset 저장 실패 (job은 COMPLETED 유지): jobId={} error={}", job.getId(), e.getMessage());
        }
    }

    // ─── HTTP 유틸 ──────────────────────────────────────────────────────────────

    /** OpenAI 임시 URL에서 이미지 바이너리를 다운로드한다. */
    private byte[] downloadImage(String url) {
        byte[] bytes = restClient.get()
                .uri(url)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new RuntimeException("이미지 다운로드 실패: HTTP " + res.getStatusCode());
                })
                .body(byte[].class);
        if (bytes == null || bytes.length == 0) {
            throw new RuntimeException("이미지 다운로드 결과가 비어 있습니다.");
        }
        return bytes;
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
