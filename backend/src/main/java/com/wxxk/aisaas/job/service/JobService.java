package com.wxxk.aisaas.job.service;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.common.exception.InactiveModuleException;
import com.wxxk.aisaas.credit.service.CreditWalletService;
import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.job.repository.JobRepository;
import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.executor.AiModuleExecutor;
import com.wxxk.aisaas.module.service.AiModuleService;
import com.wxxk.aisaas.user.entity.User;
import com.wxxk.aisaas.user.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final AiModuleService aiModuleService;
    private final CreditWalletService creditWalletService;
    private final List<AiModuleExecutor> executors;

    /**
     * Job 생성 및 실행.
     *
     * 크레딧 정책:
     * - 실행 시작 시 차감 (낙관적 차감)
     * - 실행 실패 시 전액 환불 (API 키 없음 / OpenAI 에러 / executor 미구현 모두 동일)
     * - 성공 시에만 차감 확정
     *
     * 이유: 실패가 사용자 과실이 아닌 경우(키 미설정, API 에러)에 크레딧을 소모시키지 않기 위함.
     *
     * ⚠️ 알려진 한계: executor가 동기 HTTP 호출을 포함하므로 DB 커넥션을 OpenAI 대기 시간(수~수십 초)
     * 동안 점유한다. 트래픽이 늘어나면 비동기(@Async / 메시지 큐)로 전환이 필요하다.
     */
    @Transactional
    public Job createJob(UUID userId, UUID moduleId, String inputPayload) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        AiModule module = aiModuleService.getModuleById(moduleId);

        if (!module.isActive()) {
            throw new InactiveModuleException(module.getName());
        }

        // 1단계: 크레딧 차감 (잔액 부족 시 InsufficientCreditException → 422)
        creditWalletService.deduct(userId, module.getCreditCostPerCall());

        Job job = Job.builder()
                .user(user)
                .module(module)
                .status(JobStatus.PENDING)
                .inputPayload(inputPayload)
                .creditUsed(module.getCreditCostPerCall())
                .build();

        Job saved = jobRepository.save(job);

        // 2단계: 모듈 executor 탐색 및 실행
        Optional<AiModuleExecutor> executor = executors.stream()
                .filter(e -> e.moduleName().equals(module.getName()))
                .findFirst();

        if (executor.isPresent()) {
            executor.get().execute(saved);
        } else {
            // executor가 없는 모듈(SUMMARIZATION, TRANSLATION 등 미구현): 즉시 실패 처리
            log.warn("[JobService] No executor found for module: {} (jobId={})", module.getName(), saved.getId());
            saved.fail("해당 모듈의 실행 기능이 아직 구현되지 않았습니다: " + module.getName());
        }

        // 3단계: 실패한 경우 크레딧 환불
        // 실행 전 차감 → 실패 확인 후 복구 방식으로 일관성 유지
        if (saved.getStatus() == JobStatus.FAILED) {
            creditWalletService.refund(userId, saved.getCreditUsed());
            log.info("[JobService] Credit refunded: userId={} amount={} reason=jobFailed jobId={}",
                    userId, saved.getCreditUsed(), saved.getId());
        }

        return saved;
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
