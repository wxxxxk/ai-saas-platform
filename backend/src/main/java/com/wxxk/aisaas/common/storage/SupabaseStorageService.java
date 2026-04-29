package com.wxxk.aisaas.common.storage;

import jakarta.annotation.PostConstruct;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Supabase Storage REST API 래퍼.
 *
 * 사전 설정:
 *   1. https://supabase.com 에서 프로젝트 생성
 *   2. Storage → New bucket "images" → Public 체크
 *   3. Settings → API → Project URL → supabase.url
 *   4. Settings → API → service_role key (secret) → supabase.service.key
 *
 * 업로드 엔드포인트:
 *   PUT {supabase.url}/storage/v1/object/{bucket}/{path}
 *
 * 공개 URL 패턴:
 *   {supabase.url}/storage/v1/object/public/{bucket}/{path}
 */
@Slf4j
@Service
public class SupabaseStorageService {

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service.key:}")
    private String serviceKey;

    @Value("${supabase.bucket:images}")
    private String bucket;

    private final RestClient restClient = RestClient.create();

    @PostConstruct
    void logStatus() {
        boolean urlSet = supabaseUrl != null && !supabaseUrl.isBlank();
        boolean keySet = serviceKey != null && !serviceKey.isBlank();
        if (!urlSet || !keySet) {
            log.warn("[SupabaseStorage] supabase.url 또는 supabase.service.key가 설정되지 않았습니다. " +
                    "이미지 생성 결과가 임시 URL로 저장되어 약 1시간 후 만료됩니다.");
        } else if (!serviceKey.startsWith("eyJ")) {
            log.warn("[SupabaseStorage] supabase.service.key가 유효한 JWT 형식이 아닙니다 (eyJ로 시작해야 함). " +
                    "Supabase 대시보드 → Settings → API → service_role key 를 확인하세요. " +
                    "업로드를 시도하지 않고 임시 URL로 저장됩니다.");
        } else {
            log.info("[SupabaseStorage] configured — url={} bucket={}", supabaseUrl, bucket);
        }
    }

    /**
     * URL과 service key가 모두 설정되고 key가 유효한 JWT(eyJ 시작) 형식인 경우에만 true.
     * 잘못된 키로 업로드를 시도해 불필요한 이미지 다운로드가 발생하지 않도록 한다.
     */
    public boolean isConfigured() {
        return supabaseUrl != null && !supabaseUrl.isBlank()
                && serviceKey != null && !serviceKey.isBlank()
                && serviceKey.startsWith("eyJ");
    }

    /**
     * 이미지 바이너리를 Supabase Storage에 업로드하고 공개 URL을 반환한다.
     *
     * @param jobId     Job ID (파일명에 사용: images/{jobId}.png)
     * @param imageBytes 업로드할 이미지 바이너리
     * @return 영구 공개 URL
     */
    public String uploadImage(UUID jobId, byte[] imageBytes) {
        String objectPath = "images/" + jobId + ".png";
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + objectPath;

        log.info("[SupabaseStorage] uploading image — jobId={} size={}bytes", jobId, imageBytes.length);

        restClient.put()
                .uri(uploadUrl)
                .header("Authorization", "Bearer " + serviceKey)
                .header("x-upsert", "true")      // 동일 파일 덮어쓰기 허용
                .contentType(MediaType.IMAGE_PNG)
                .body(imageBytes)
                .retrieve()
                .onStatus(status -> !status.is2xxSuccessful(), (req, res) -> {
                    throw new RuntimeException(
                            "Supabase upload failed: HTTP " + res.getStatusCode());
                })
                .toBodilessEntity();

        String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + objectPath;
        log.info("[SupabaseStorage] upload success — publicUrl={}", publicUrl);
        return publicUrl;
    }

    /**
     * 저장된 이미지의 공개 URL을 반환한다. (업로드 후 URL 재구성용)
     */
    public String getPublicUrl(UUID jobId) {
        return supabaseUrl + "/storage/v1/object/public/" + bucket + "/images/" + jobId + ".png";
    }
}
