package com.wxxk.aisaas.asset.entity;

import com.wxxk.aisaas.common.entity.BaseEntity;
import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "assets")
public class Asset extends BaseEntity {

    // MVP: Asset은 반드시 Job에 속함 (nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String fileName;

    // MIME type (예: image/png, text/plain)
    @Column(nullable = false)
    private String fileType;

    // 외부 스토리지 객체 키 (S3 key 등)
    @Column(nullable = false)
    private String storageKey;

    @Column(nullable = false)
    private Long fileSizeBytes;

    @Builder
    private Asset(Job job, User user, String fileName, String fileType, String storageKey, Long fileSizeBytes) {
        this.job = job;
        this.user = user;
        this.fileName = fileName;
        this.fileType = fileType;
        this.storageKey = storageKey;
        this.fileSizeBytes = fileSizeBytes;
    }
}
