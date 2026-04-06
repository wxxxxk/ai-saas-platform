package com.wxxk.aisaas.module.executor;

import com.wxxk.aisaas.asset.service.AssetService;
import com.wxxk.aisaas.job.entity.Job;
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

    @Override
    public String moduleName() {
        return "TEXT_GENERATION";
    }

    @Override
    public void execute(Job job) {
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
