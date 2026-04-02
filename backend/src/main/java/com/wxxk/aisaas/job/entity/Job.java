package com.wxxk.aisaas.job.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "jobs")
public class Job extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private AiModule module;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobStatus status;

    @Column(columnDefinition = "TEXT")
    private String inputPayload;

    @Column(columnDefinition = "TEXT")
    private String outputPayload;

    @Column
    private String errorMessage;

    // 실제 차감된 크레딧 (module.creditCostPerCall 기준으로 결정)
    @Column(nullable = false)
    private Integer creditUsed;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime completedAt;

    @Builder
    private Job(User user, AiModule module, JobStatus status, String inputPayload, Integer creditUsed) {
        this.user = user;
        this.module = module;
        this.status = status;
        this.inputPayload = inputPayload;
        this.creditUsed = creditUsed;
    }

    public void start() {
        this.status = JobStatus.RUNNING;
        this.startedAt = LocalDateTime.now();
    }

    public void complete(String outputPayload) {
        this.status = JobStatus.COMPLETED;
        this.outputPayload = outputPayload;
        this.completedAt = LocalDateTime.now();
    }

    public void fail(String errorMessage) {
        this.status = JobStatus.FAILED;
        this.errorMessage = errorMessage;
        this.completedAt = LocalDateTime.now();
    }

    public void cancel() {
        this.status = JobStatus.CANCELLED;
        this.completedAt = LocalDateTime.now();
    }
}
