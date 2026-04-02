package com.wxxk.aisaas.asset.controller;

import com.wxxk.aisaas.asset.dto.AssetResponse;
import com.wxxk.aisaas.asset.dto.CreateAssetRequest;
import com.wxxk.aisaas.asset.service.AssetService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping
    public ResponseEntity<List<AssetResponse>> getAssetsByJob(@PathVariable UUID jobId) {
        List<AssetResponse> response = assetService.getAssetsByJobId(jobId)
                .stream()
                .map(AssetResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<AssetResponse> createAsset(
            @PathVariable UUID jobId,
            @Valid @RequestBody CreateAssetRequest request) {
        AssetResponse response = AssetResponse.from(
                assetService.saveAsset(
                        jobId,
                        request.getUserId(),
                        request.getFileName(),
                        request.getFileType(),
                        "pending",
                        request.getFileSizeBytes()
                )
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
