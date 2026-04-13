package com.wxxk.aisaas.module.executor;

import com.wxxk.aisaas.asset.service.AssetService;
import com.wxxk.aisaas.job.entity.Job;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
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

    private final RestClient restClient = RestClient.create();

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
        try {
            String generated = callOpenAi(job.getInputPayload());
            job.complete(generated);
            assetService.saveAsset(
                    job.getId(),
                    job.getUser().getId(),
                    "output.txt",
                    "text/plain",
                    "job-output:" + job.getId(),
                    (long) generated.getBytes(StandardCharsets.UTF_8).length
            );
        } catch (Exception e) {
            log.error("OpenAI call failed for job {}: {}", job.getId(), e.getMessage());
            job.fail(e.getMessage());
        }
    }

    private String callOpenAi(String prompt) {
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
                .body(OpenAiResponse.class);

        return response.choices().get(0).message().content();
    }

    private record OpenAiResponse(List<Choice> choices) {}
    private record Choice(Message message) {}
    private record Message(String content) {}
}
