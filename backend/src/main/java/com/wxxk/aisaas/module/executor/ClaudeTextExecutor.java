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
 * TEXT_GENERATION 모듈을 Claude API (Anthropic Messages API)로 실행하는 executor.
 *
 * 공존 관계:
 *   TEXT_GENERATION + OPENAI  →  OpenAiTextExecutor  (기본값)
 *   TEXT_GENERATION + GEMINI  →  GeminiTextExecutor
 *   TEXT_GENERATION + CLAUDE  →  ClaudeTextExecutor  (이 클래스)
 *
 * provider 선택: POST /api/jobs 요청 body에 "provider": "CLAUDE" 를 포함한다.
 * 이 클래스를 등록하는 것만으로 GET /api/modules 의 supportedProviders에
 * "CLAUDE"가 자동 포함되며, 프론트엔드 UI에도 즉시 반영된다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClaudeTextExecutor implements AiModuleExecutor {

    // claude-haiku-4-5 — 속도/비용 균형 모델. 업그레이드 시 이 상수만 변경한다.
    private static final String MODEL = "claude-haiku-4-5-20251001";
    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    // Anthropic API 버전 헤더 — 반드시 포함해야 한다.
    private static final String ANTHROPIC_VERSION = "2023-06-01";
    // 최대 출력 토큰 수. 텍스트 생성 용도에 맞게 조정한다.
    private static final int MAX_TOKENS = 1024;

    private final AssetService assetService;

    // final이 아닌 필드는 Lombok 생성자 대상에서 제외되므로, @Value 필드 주입이 정상 동작한다.
    @Value("${claude.api.key:}")
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
            log.warn("[TEXT_GENERATION/CLAUDE] claude.api.key is BLANK — CLAUDE_API_KEY 환경변수를 확인하세요");
        } else {
            String masked = apiKey.substring(0, Math.min(7, apiKey.length()))
                    + "*** (length=" + apiKey.length() + ")";
            log.info("[TEXT_GENERATION/CLAUDE] claude.api.key loaded: {}", masked);
        }
    }

    @Override
    public String moduleName() {
        return "TEXT_GENERATION";
    }

    @Override
    public AiProvider provider() {
        return AiProvider.CLAUDE;
    }

    @Override
    public void execute(Job job) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("[TEXT_GENERATION/CLAUDE] apiKey is blank at execute time (jobId={}) — 기동 로그에서 key 상태를 확인하세요",
                    job.getId());
            job.fail("CLAUDE_API_KEY가 설정되지 않았습니다. 환경변수를 확인하세요.");
            return;
        }

        job.start();
        log.info("[TEXT_GENERATION/CLAUDE] started: jobId={} prompt=\"{}\"",
                job.getId(), job.getInputPayload());

        // 1단계: Claude 호출 — 실패하면 job.fail() 후 즉시 종료
        String generated;
        try {
            generated = callClaude(job.getInputPayload());
        } catch (Exception e) {
            String msg = e.getMessage() != null
                    ? e.getMessage()
                    : "텍스트 생성 중 알 수 없는 오류가 발생했습니다.";
            log.error("[TEXT_GENERATION/CLAUDE] Claude call failed: jobId={} error={}",
                    job.getId(), msg, e);
            job.fail(msg);
            return;
        }

        // 2단계: Claude 성공 → outputPayload에 텍스트 저장, COMPLETED 확정
        job.complete(generated);
        log.info("[TEXT_GENERATION/CLAUDE] completed: jobId={} outputLength={}",
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
            log.warn("[TEXT_GENERATION/CLAUDE] asset save failed for job {} (job stays COMPLETED): {}",
                    job.getId(), e.getMessage());
        }
    }

    // ─── Claude REST call ─────────────────────────────────────────────────────
    //
    // Claude Messages API request body:
    //   {
    //     "model": "claude-haiku-4-5-20251001",
    //     "max_tokens": 1024,
    //     "messages": [ { "role": "user", "content": "<prompt>" } ]
    //   }
    //
    // Claude Messages API response (success):
    //   {
    //     "content": [ { "type": "text", "text": "<output>" } ],
    //     "stop_reason": "end_turn"
    //   }
    //
    // Claude Messages API response (error):
    //   { "type": "error", "error": { "type": "<error_type>", "message": "..." } }
    //
    // API key is passed in the x-api-key header.
    // anthropic-version header is required.

    private String callClaude(String prompt) throws IOException {
        var body = Map.of(
                "model", MODEL,
                "max_tokens", MAX_TOKENS,
                "messages", List.of(
                        Map.of("role", "user", "content", prompt != null ? prompt : "")
                )
        );

        ClaudeResponse response = restClient.post()
                .uri(API_URL)
                .header("x-api-key", apiKey)
                .header("anthropic-version", ANTHROPIC_VERSION)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    String rawBody = StreamUtils.copyToString(res.getBody(), StandardCharsets.UTF_8);
                    log.error("[TEXT_GENERATION/CLAUDE] Claude API error: status={} body={}",
                            res.getStatusCode(), rawBody);
                    throw new RuntimeException(resolveUserMessage(rawBody));
                })
                .body(ClaudeResponse.class);

        if (response == null || response.content() == null || response.content().isEmpty()) {
            log.error("[TEXT_GENERATION/CLAUDE] Claude returned null or empty content");
            throw new RuntimeException("텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }

        // content 배열에서 type=text인 첫 번째 블록의 텍스트를 추출한다.
        String text = response.content().stream()
                .filter(b -> "text".equals(b.type()))
                .map(ContentBlock::text)
                .findFirst()
                .orElse(null);

        if (text == null || text.isBlank()) {
            log.error("[TEXT_GENERATION/CLAUDE] Claude returned no text content block");
            throw new RuntimeException("AI가 빈 응답을 반환했습니다. 다시 시도해 주세요.");
        }
        return text;
    }

    private String resolveUserMessage(String rawBody) {
        if (rawBody == null) {
            return "텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("authentication_error") || rawBody.contains("invalid_api_key")) {
            return "API 키 설정 오류입니다. 관리자에게 문의하세요.";
        }
        if (rawBody.contains("rate_limit_error") || rawBody.contains("rate_limit_exceeded")) {
            return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("overloaded_error")) {
            return "서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("invalid_request_error") && rawBody.contains("too long")) {
            return "입력 텍스트가 너무 깁니다. 짧게 줄여서 다시 시도해 주세요.";
        }
        return "텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    // ─── Claude Messages API response records ────────────────────────────────
    //
    // 필드 이름은 Anthropic Messages API JSON 키와 정확히 일치해야 한다.
    // 알 수 없는 필드는 Jackson이 기본으로 무시하므로 모든 필드를 선언할 필요는 없다.

    private record ClaudeResponse(List<ContentBlock> content) {}
    private record ContentBlock(String type, String text) {}
}
