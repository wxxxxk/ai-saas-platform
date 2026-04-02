package com.wxxk.aisaas.job.repository;

import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobRepository extends JpaRepository<Job, UUID> {

    List<Job> findAllByUserId(UUID userId);

    List<Job> findAllByUserIdAndStatus(UUID userId, JobStatus status);
}
