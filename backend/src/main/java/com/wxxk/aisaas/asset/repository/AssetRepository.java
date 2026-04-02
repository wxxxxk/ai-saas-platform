package com.wxxk.aisaas.asset.repository;

import com.wxxk.aisaas.asset.entity.Asset;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<Asset, UUID> {

    List<Asset> findAllByJobId(UUID jobId);

    List<Asset> findAllByUserId(UUID userId);
}
