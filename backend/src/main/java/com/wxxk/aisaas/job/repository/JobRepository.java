package com.wxxk.aisaas.job.repository;

import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobRepository extends JpaRepository<Job, UUID> {

    // 최신 job이 먼저 오도록 createdAt DESC 정렬
    List<Job> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Job> findAllByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, JobStatus status);
}
