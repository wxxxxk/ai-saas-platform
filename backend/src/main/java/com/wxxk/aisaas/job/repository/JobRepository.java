package com.wxxk.aisaas.job.repository;

import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobRepository extends JpaRepository<Job, UUID> {

    /**
     * 단건 조회: JOIN FETCH로 User·AiModule을 트랜잭션 안에서 미리 로드한다.
     * 기본 findById()는 LAZY 프록시를 반환하므로 @Transactional 밖(컨트롤러)에서
     * job.getModule().getName() 등 비-ID 필드 접근 시 LazyInitializationException이 발생한다.
     */
    @Query("SELECT j FROM Job j JOIN FETCH j.user JOIN FETCH j.module WHERE j.id = :jobId")
    Optional<Job> findByIdWithJoins(@Param("jobId") UUID jobId);

    /**
     * 목록 조회: JOIN FETCH로 User·AiModule을 트랜잭션 안에서 미리 로드한다.
     */
    @Query("SELECT j FROM Job j JOIN FETCH j.user JOIN FETCH j.module WHERE j.user.id = :userId ORDER BY j.createdAt DESC")
    List<Job> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT j FROM Job j JOIN FETCH j.user JOIN FETCH j.module WHERE j.user.id = :userId AND j.status = :status ORDER BY j.createdAt DESC")
    List<Job> findAllByUserIdAndStatusOrderByCreatedAtDesc(@Param("userId") UUID userId, @Param("status") JobStatus status);
}
