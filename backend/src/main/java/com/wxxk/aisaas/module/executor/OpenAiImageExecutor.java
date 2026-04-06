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
            log.info("IMAGE_GENERATION: OpenAI response received jobId={} urlLength={} url={}",
                    job.getId(), imageUrl.length(), imageUrl);

            job.complete(imageUrl);

            log.info("IMAGE_GENERATION: saving asset jobId={} userId={} storageKeyLength={}",
                    job.getId(), job.getUser().getId(), imageUrl.length());
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
            log.error("IMAGE_GENERATION failed (caught): jobId={} exceptionType={} error={}",
                    job.getId(), e.getClass().getSimpleName(), e.getMessage(), e);
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
                    String responseBody = StreamUtils.copyToString(res.getBody(), StandardCharsets.UTF_8);
                    log.error("OpenAI DALL-E API error: status={} body={}", res.getStatusCode(), responseBody);
                    throw new RuntimeException("DALL-E API error [" + res.getStatusCode() + "]: " + responseBody);
                })
                .body(DallEResponse.class);

        return response.data().get(0).url();
    }

    private record DallEResponse(List<ImageData> data) {}
    private record ImageData(String url) {}
}
