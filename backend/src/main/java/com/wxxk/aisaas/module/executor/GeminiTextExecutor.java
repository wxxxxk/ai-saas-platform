package com.wxxk.aisaas.module.executor;

import com.wxxk.aisaas.asset.service.AssetService;
import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.module.enums.AiProvider;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

/**
 * TEXT_GENERATION 모듈을 Gemini API로 실행하는 executor.
 *
 * 공존 관계:
 *   TEXT_GENERATION + OPENAI  →  OpenAiTextExecutor (현재 기본값)
 *   TEXT_GENERATION + GEMINI  →  GeminiTextExecutor (이 클래스)
 *
 * Gemini로 테스트하려면 POST /api/jobs 요청 body에 "provider": "GEMINI" 를 포함한다.
 * AiModuleInitializer가 서버 재기동 시 defaultProvider 를 OPENAI 로 재설정하므로
 * DB를 직접 UPDATE 해도 다음 재기동 시 원복된다. per-request override 를 사용할 것.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiTextExecutor implements AiModuleExecutor {

    // Gemini 2.0 Flash — 속도/비용 균형이 좋은 모델. 업그레이드 시 이 상수만 변경한다.
    private static final String MODEL = "gemini-2.0-flash";
    private static final String BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";

    private final AssetService assetService;

    // final이 아닌 필드는 Lombok 생성자 대상에서 제외되므로, @Value 필드 주입이 정상 동작한다.
    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestClient restClient = buildRestClient(30_000); // 텍스트 생성 최대 30초

    private static RestClient buildRestClient(int readTimeoutMs) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(readTimeoutMs);
        return RestClient.builder().requestFactory(factory).build();
    }

    @PostConstruct
    void logKeyStatus() {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[TEXT_GENERATION/GEMINI] gemini.api.key is BLANK — GEMINI_API_KEY 환경변수를 확인하세요");
        } else {
            String masked = apiKey.substring(0, Math.min(5, apiKey.length()))
                    + "*** (length=" + apiKey.length() + ")";
            log.info("[TEXT_GENERATION/GEMINI] gemini.api.key loaded: {}", masked);
        }
    }

    @Override
    public String moduleName() {
        return "TEXT_GENERATION";
    }

    @Override
    public AiProvider provider() {
        return AiProvider.GEMINI;
    }

    @Override
    public void execute(Job job) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("[TEXT_GENERATION/GEMINI] apiKey is blank at execute time (jobId={}) — 기동 로그에서 key 상태를 확인하세요",
                    job.getId());
            job.fail("GEMINI_API_KEY가 설정되지 않았습니다. 환경변수를 확인하세요.");
            return;
        }

        job.start();
        log.info("[TEXT_GENERATION/GEMINI] started: jobId={} prompt=\"{}\"",
                job.getId(), job.getInputPayload());

        // 1단계: Gemini 호출 — 실패하면 job.fail() 후 즉시 종료
        String generated;
        try {
            generated = callGemini(job.getInputPayload());
        } catch (Exception e) {
            String msg = e.getMessage() != null
                    ? e.getMessage()
                    : "텍스트 생성 중 알 수 없는 오류가 발생했습니다.";
            log.error("[TEXT_GENERATION/GEMINI] Gemini call failed: jobId={} error={}",
                    job.getId(), msg, e);
            job.fail(msg);
            return;
        }

        // 2단계: Gemini 성공 → outputPayload에 JSON envelope 저장, COMPLETED 확정
        String payload = TextResultPayload.toJson(generated, job.getId().toString(), "gemini", MODEL);
        job.complete(payload);
        log.info("[TEXT_GENERATION/GEMINI] completed: jobId={} outputLength={}",
                job.getId(), generated.length());

        // 3단계: Asset 저장 — 실패해도 job은 COMPLETED 유지 (outputPayload에 결과가 있으므로)
        try {
            assetService.saveAsset(
                    job.getId(),
                    job.getUser().getId(),
                    "output.txt",
                    "text/plain",
                    "job-output:" + job.getId(),
                    (long) generated.getBytes(StandardCharsets.UTF_8).length
            );
        } catch (Exception e) {
            log.warn("[TEXT_GENERATION/GEMINI] asset save failed for job {} (job stays COMPLETED): {}",
                    job.getId(), e.getMessage());
        }
    }

    // ─── Gemini REST call ─────────────────────────────────────────────────────────
    //
    // Gemini REST request body:
    //   { "contents": [ { "parts": [ { "text": "<prompt>" } ] } ] }
    //
    // Gemini REST response (success):
    //   { "candidates": [ { "content": { "parts": [ { "text": "<output>" } ] } } ] }
    //
    // Gemini REST response (safety blocked):
    //   { "candidates": [], "promptFeedback": { "blockReason": "SAFETY" } }
    //
    // API key is passed as a query parameter (not Authorization header).

    private String callGemini(String prompt) throws IOException {
        var body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt != null ? prompt : "")
                        ))
                )
        );

        // apiKey는 Gemini REST API의 인증 방식에 따라 쿼리 파라미터로 전달한다.
        // Google API 키는 영숫자 및 '-', '_' 만 포함하므로 URL 인코딩 없이 안전하다.
        GeminiResponse response = restClient.post()
                .uri(BASE_URL + "?key=" + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    String rawBody = StreamUtils.copyToString(res.getBody(), StandardCharsets.UTF_8);
                    log.error("[TEXT_GENERATION/GEMINI] Gemini API error: status={} body={}",
                            res.getStatusCode(), rawBody);
                    throw new RuntimeException(resolveUserMessage(rawBody));
                })
                .body(GeminiResponse.class);

        // 빈 candidates — 대부분 safety 필터 차단
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            String blockReason = (response != null && response.promptFeedback() != null)
                    ? response.promptFeedback().blockReason()
                    : null;
            if (blockReason != null) {
                log.warn("[TEXT_GENERATION/GEMINI] content blocked: reason={}", blockReason);
                throw new RuntimeException(
                        "입력 내용이 안전 정책에 의해 거절되었습니다. 다른 방식으로 표현해 보세요.");
            }
            log.error("[TEXT_GENERATION/GEMINI] Gemini returned null or empty candidates");
            throw new RuntimeException("텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }

        Candidate candidate = response.candidates().get(0);
        if (candidate.content() == null
                || candidate.content().parts() == null
                || candidate.content().parts().isEmpty()) {
            log.error("[TEXT_GENERATION/GEMINI] Gemini returned candidate with no content parts");
            throw new RuntimeException("텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }

        String text = candidate.content().parts().get(0).text();
        if (text == null || text.isBlank()) {
            log.error("[TEXT_GENERATION/GEMINI] Gemini returned blank text");
            throw new RuntimeException("AI가 빈 응답을 반환했습니다. 다시 시도해 주세요.");
        }
        return text;
    }

    private String resolveUserMessage(String rawBody) {
        if (rawBody == null) {
            return "텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("API_KEY_INVALID") || rawBody.contains("API key not valid")) {
            return "API 키 설정 오류입니다. 관리자에게 문의하세요.";
        }
        if (rawBody.contains("RESOURCE_EXHAUSTED") || rawBody.contains("quota")) {
            return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("SAFETY") || rawBody.contains("safety")) {
            return "입력 내용이 안전 정책에 의해 거절되었습니다. 다른 방식으로 표현해 보세요.";
        }
        if (rawBody.contains("User input is too long") || rawBody.contains("TOO_LONG")) {
            return "입력 텍스트가 너무 깁니다. 짧게 줄여서 다시 시도해 주세요.";
        }
        return "텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    // ─── Gemini REST response records ─────────────────────────────────────────────
    //
    // 필드 이름은 Gemini REST API JSON 키와 정확히 일치해야 한다.
    // 알 수 없는 필드는 Jackson이 기본으로 무시하므로 모든 필드를 선언할 필요는 없다.

    private record GeminiResponse(List<Candidate> candidates, PromptFeedback promptFeedback) {}
    private record Candidate(Content content, String finishReason) {}
    private record Content(List<Part> parts, String role) {}
    private record Part(String text) {}
    private record PromptFeedback(String blockReason) {}
}
