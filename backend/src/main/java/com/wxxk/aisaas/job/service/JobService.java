package com.wxxk.aisaas.job.service;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.common.exception.InactiveModuleException;
import com.wxxk.aisaas.credit.service.CreditWalletService;
import com.wxxk.aisaas.job.dto.CreateJobRequest;
import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.job.repository.JobRepository;
import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.enums.AiProvider;
import com.wxxk.aisaas.module.executor.AiModuleExecutor;
import com.wxxk.aisaas.module.service.AiModuleService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final AiModuleService aiModuleService;
    private final CreditWalletService creditWalletService;
    private final List<AiModuleExecutor> executors;
    private final JobPersistenceService jobPersistenceService;
    private final JobExecutionService jobExecutionService;

    /**
     * Job 생성 후 즉시 PENDING 상태로 반환.
     * AI 실행은 비동기로 dispatch하여 HTTP 응답을 블로킹하지 않는다.
     *
     * 크레딧 정책:
     * - createPending() 시점에 차감 (낙관적 차감)
     * - 실패 시 환불: executor 미발견(동기), dispatch 실패(동기), 비동기 실행 실패(JobExecutionService)
     * - 성공 시에만 차감 확정
     *
     * 상태 전이: PENDING → RUNNING → COMPLETED / FAILED
     */
    public Job createJob(UUID userId, CreateJobRequest request) {
        AiModule module = aiModuleService.getModuleById(request.getModuleId());

        if (!module.isActive()) {
            throw new InactiveModuleException(module.getName());
        }

        AiProvider resolvedProvider = resolveProvider(module, request);

        // Phase 1: 짧은 TX — 크레딧 차감 + PENDING job 생성
        Job job = jobPersistenceService.createPending(
                userId,
                request.getModuleId(),
                resolvedProvider,
                request.getInputPayload(),
                module.getCreditCostPerCall(),
                null,                            // parentJobId: 사용자가 직접 생성하는 Job
                request.getNextModuleName()
        );

        // Phase 2: executor 선택
        Optional<AiModuleExecutor> executorOpt = executors.stream()
                .filter(e -> e.moduleName().equals(module.getName())
                          && e.provider() == resolvedProvider)
                .findFirst();

        if (executorOpt.isEmpty()) {
            log.warn("[JobService] No executor: module={} provider={} jobId={}",
                    module.getName(), resolvedProvider, job.getId());
            jobPersistenceService.markFailed(job.getId(),
                    "해당 모듈/공급자 조합의 실행 기능이 아직 구현되지 않았습니다: "
                            + module.getName() + " / " + resolvedProvider);
            creditWalletService.refund(userId, job.getCreditUsed());
            log.info("[JobService] refunded (no executor): userId={} amount={} jobId={}",
                    userId, job.getCreditUsed(), job.getId());
            return job;
        }

        // Phase 3: 비동기 dispatch — thread pool 포화 시 RejectedExecutionException
        try {
            jobExecutionService.executeJobAsync(job, userId, executorOpt.get());
        } catch (Exception e) {
            log.error("[JobService] Async dispatch failed: jobId={} module={} provider={} error={}",
                    job.getId(), module.getName(), resolvedProvider, e.getMessage(), e);
            jobPersistenceService.markFailed(job.getId(),
                    "서버가 바빠 작업을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.");
            creditWalletService.refund(userId, job.getCreditUsed());
            log.info("[JobService] refunded (dispatch rejected): userId={} amount={} jobId={}",
                    userId, job.getCreditUsed(), job.getId());
        }

        // PENDING Job 즉시 반환 (AI 실행은 백그라운드에서 진행)
        return job;
    }

    /**
     * 사용할 AI 공급자를 결정한다.
     *
     * 우선순위:
     *   1. request.getProvider() — 요청에 명시된 경우 (API / 테스트 시 직접 지정)
     *   2. module.getDefaultProvider() — 명시 없으면 모듈 기본값 사용
     *
     * 기존 프론트엔드는 provider 필드를 보내지 않으므로 null → 기본값으로 처리되어
     * 동작 변화 없음.
     */
    private AiProvider resolveProvider(AiModule module, CreateJobRequest request) {
        if (request.getProvider() != null) {
            log.info("[JobService] provider override from request: {}", request.getProvider());
            return request.getProvider();
        }
        return module.getDefaultProvider();
    }

    /**
     * Job 조회 + 소유권 검증.
     * 존재하지 않거나 다른 사용자의 job인 경우 동일하게 404를 반환한다.
     * (403 대신 404: job의 존재 자체를 노출하지 않음)
     */
    @Transactional(readOnly = true)
    public Job getJobByIdForUser(UUID jobId, UUID userId) {
        Job job = getJobById(jobId);
        if (!job.getUser().getId().equals(userId)) {
            throw new EntityNotFoundException("Job", jobId);
        }
        return job;
    }

    @Transactional
    public Job startJob(UUID jobId, UUID userId) {
        Job job = getJobByIdForUser(jobId, userId);
        job.start();
        return job;
    }

    @Transactional
    public Job completeJob(UUID jobId, UUID userId, String outputPayload) {
        Job job = getJobByIdForUser(jobId, userId);
        job.complete(outputPayload);
        return job;
    }

    @Transactional
    public Job failJob(UUID jobId, UUID userId, String errorMessage) {
        Job job = getJobByIdForUser(jobId, userId);
        job.fail(errorMessage);
        return job;
    }

    @Transactional
    public Job cancelJob(UUID jobId, UUID userId) {
        Job job = getJobByIdForUser(jobId, userId);
        job.cancel();
        return job;
    }

    @Transactional(readOnly = true)
    public Job getJobById(UUID jobId) {
        // findByIdWithJoins: JOIN FETCH로 user·module을 트랜잭션 안에서 로드한다.
        // 기본 findById()는 LAZY 프록시를 반환하므로 @Transactional 밖에서
        // job.getModule().getName() 접근 시 LazyInitializationException이 발생한다.
        return jobRepository.findByIdWithJoins(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job", jobId));
    }

    @Transactional(readOnly = true)
    public List<Job> getJobsByUserId(UUID userId) {
        return jobRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<Job> getJobsByUserIdAndStatus(UUID userId, JobStatus status) {
        return jobRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }
}
