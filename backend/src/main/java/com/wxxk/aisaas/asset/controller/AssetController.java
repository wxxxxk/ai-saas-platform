package com.wxxk.aisaas.asset.controller;

import com.wxxk.aisaas.asset.dto.AssetResponse;
import com.wxxk.aisaas.asset.dto.CreateAssetRequest;
import com.wxxk.aisaas.asset.service.AssetService;
import com.wxxk.aisaas.job.service.JobService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jobs/{jobId}/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;
    private final JobService jobService;

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAssetsByJob(
            @PathVariable UUID jobId, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        // 소유권 확인: 본인 job이 아니면 404
        jobService.getJobByIdForUser(jobId, userId);
        List<AssetResponse> response = assetService.getAssetsByJobId(jobId)
                .stream()
                .map(AssetResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<AssetResponse> createAsset(
            @PathVariable UUID jobId,
            @Valid @RequestBody CreateAssetRequest request, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        AssetResponse response = AssetResponse.from(
                assetService.saveAsset(
                        jobId,
                        userId,
                        request.getFileName(),
                        request.getFileType(),
                        "pending",
                        request.getFileSizeBytes()
                )
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
