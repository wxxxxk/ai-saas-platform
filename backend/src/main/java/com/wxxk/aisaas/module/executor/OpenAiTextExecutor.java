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
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiTextExecutor implements AiModuleExecutor {

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODEL = "gpt-4o-mini";

    private final AssetService assetService;

    // final이 아닌 필드는 Lombok 생성자 대상에서 제외되므로, @Value 필드 주입이 정상 동작한다.
    @Value("${openai.api.key}")
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
            log.warn("[TEXT_GENERATION] openai.api.key is BLANK — OPENAI_API_KEY 환경변수를 확인하세요");
        } else {
            String masked = apiKey.substring(0, Math.min(5, apiKey.length())) + "*** (length=" + apiKey.length() + ")";
            log.info("[TEXT_GENERATION] openai.api.key loaded: {}", masked);
        }
    }

    @Override
    public String moduleName() {
        return "TEXT_GENERATION";
    }

    @Override
    public void execute(Job job) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("[TEXT_GENERATION] apiKey is blank at execute time (jobId={}) — 기동 로그에서 key 상태를 확인하세요", job.getId());
            job.fail("OPENAI_API_KEY가 설정되지 않았습니다. 환경변수를 확인하세요.");
            return;
        }
        job.start();
        log.info("[TEXT_GENERATION] started: jobId={} prompt=\"{}\"", job.getId(), job.getInputPayload());

        // 1단계: OpenAI 호출 — 실패하면 job.fail() 후 즉시 종료
        String generated;
        try {
            generated = callOpenAi(job.getInputPayload());
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : "텍스트 생성 중 알 수 없는 오류가 발생했습니다.";
            log.error("[TEXT_GENERATION] OpenAI call failed: jobId={} error={}", job.getId(), msg, e);
            job.fail(msg);
            return;
        }

        // 2단계: OpenAI 성공 → outputPayload에 텍스트 저장, COMPLETED 확정
        job.complete(generated);
        log.info("[TEXT_GENERATION] completed: jobId={} outputLength={}", job.getId(), generated.length());

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
            log.warn("[TEXT_GENERATION] asset save failed for job {} (job stays COMPLETED): {}", job.getId(), e.getMessage());
        }
    }

    private String callOpenAi(String prompt) throws IOException {
        var body = Map.of(
                "model", MODEL,
                "messages", List.of(Map.of("role", "user", "content", prompt != null ? prompt : ""))
        );

        OpenAiResponse response = restClient.post()
                .uri(OPENAI_URL)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    String rawBody = StreamUtils.copyToString(res.getBody(), StandardCharsets.UTF_8);
                    log.error("[TEXT_GENERATION] OpenAI API error: status={} body={}", res.getStatusCode(), rawBody);
                    throw new RuntimeException(resolveUserMessage(rawBody));
                })
                .body(OpenAiResponse.class);

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            log.error("[TEXT_GENERATION] OpenAI returned null or empty choices");
            throw new RuntimeException("텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        }
        String content = response.choices().get(0).message().content();
        if (content == null || content.isBlank()) {
            log.error("[TEXT_GENERATION] OpenAI returned blank content");
            throw new RuntimeException("AI가 빈 응답을 반환했습니다. 다시 시도해 주세요.");
        }
        return content;
    }

    private String resolveUserMessage(String rawBody) {
        if (rawBody == null) {
            return "텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("invalid_api_key")) {
            return "API 키 설정 오류입니다. 관리자에게 문의하세요.";
        }
        if (rawBody.contains("rate_limit_exceeded")) {
            return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("billing_hard_limit_reached")) {
            return "API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.";
        }
        if (rawBody.contains("context_length_exceeded")) {
            return "입력 텍스트가 너무 깁니다. 짧게 줄여서 다시 시도해 주세요.";
        }
        return "텍스트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    }

    private record OpenAiResponse(List<Choice> choices) {}
    private record Choice(Message message) {}
    private record Message(String content) {}
}
