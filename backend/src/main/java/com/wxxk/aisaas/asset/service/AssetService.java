package com.wxxk.aisaas.asset.service;

import com.wxxk.aisaas.asset.entity.Asset;
import com.wxxk.aisaas.asset.repository.AssetRepository;
import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.job.repository.JobRepository;
import com.wxxk.aisaas.user.entity.User;
import com.wxxk.aisaas.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    @Transactional
    public Asset saveAsset(UUID jobId, UUID userId, String fileName, String fileType,
            String storageKey, Long fileSizeBytes) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job", jobId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        Asset asset = Asset.builder()
                .job(job)
                .user(user)
                .fileName(fileName)
                .fileType(fileType)
                .storageKey(storageKey)
                .fileSizeBytes(fileSizeBytes)
                .build();

        Asset saved = assetRepository.save(asset);

        if (job.getStatus() != JobStatus.COMPLETED) {
            job.complete(null);
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Asset> getAssetsByJobId(UUID jobId) {
        return assetRepository.findAllByJobId(jobId);
    }

    @Transactional(readOnly = true)
    public List<Asset> getAssetsByUserId(UUID userId) {
        return assetRepository.findAllByUserId(userId);
    }
}
