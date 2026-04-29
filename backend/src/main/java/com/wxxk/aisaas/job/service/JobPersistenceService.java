package com.wxxk.aisaas.job.service;

import com.wxxk.aisaas.common.exception.EntityNotFoundException;
import com.wxxk.aisaas.credit.service.CreditWalletService;
import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.job.repository.JobRepository;
import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.enums.AiProvider;
import com.wxxk.aisaas.module.service.AiModuleService;
import com.wxxk.aisaas.user.entity.User;
import com.wxxk.aisaas.user.repository.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Job 생성·결과 저장 전용 트랜잭션 서비스.
 *
 * AI API 호출(수~90초)은 이 서비스 밖에서 트랜잭션 없이 수행한다.
 * 각 메서드는 수십 ms의 짧은 트랜잭션으로 실행되어 DB 커넥션 점유를 최소화한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobPersistenceService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final AiModuleService aiModuleService;
    private final CreditWalletService creditWalletService;

    /**
     * 크레딧 차감 + PENDING Job 생성을 하나의 짧은 트랜잭션으로 처리.
     * 이 메서드가 완료되면 DB 커넥션이 즉시 반환된다.
     * 이후 AI API 호출은 커넥션을 점유하지 않는다.
     */
    @Transactional
    public Job createPending(UUID userId, UUID moduleId, AiProvider provider,
                              String inputPayload, int creditCost) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        AiModule module = aiModuleService.getModuleById(moduleId);

        creditWalletService.deduct(userId, creditCost);

        Job job = Job.builder()
                .user(user)
                .module(module)
                .provider(provider)
                .status(JobStatus.PENDING)
                .inputPayload(inputPayload)
                .creditUsed(creditCost)
                .build();

        Job saved = jobRepository.save(job);
        log.info("[JobPersistence] PENDING: jobId={} userId={} provider={}",
                saved.getId(), userId, provider);
        return saved;
    }

    /**
     * PENDING → RUNNING 상태 전이를 DB에 즉시 반영한다.
     * polling 클라이언트가 RUNNING을 볼 수 있도록 비동기 실행 직전에 호출한다.
     */
    @Transactional
    public void markRunning(UUID jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job", jobId));
        job.start();
        log.info("[JobPersistence] RUNNING: jobId={}", jobId);
    }

    /**
     * 비동기 실행 중 복구 불가 오류 발생 시 Job을 FAILED로 강제 전이한다.
     * executor 내부에서 정상적으로 fail()이 호출된 경우와는 달리,
     * persistResult()가 호출되지 않은 상황(executor 예외, dispatch 실패 등)에서 사용한다.
     */
    @Transactional
    public void markFailed(UUID jobId, String errorMessage) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job", jobId));
        job.fail(errorMessage);
        log.info("[JobPersistence] FAILED (mark): jobId={} error={}", jobId, errorMessage);
    }

    /**
     * executor가 in-memory로 변경한 Job 엔티티를 DB에 반영한다.
     *
     * save() 는 detached 엔티티를 merge() 한다.
     * merge() 가 반환하는 managed copy 의 module/user 는 Hibernate 프록시이므로,
     * 트랜잭션이 끝난 뒤 Controller 에서 getName() 등을 호출하면
     * LazyInitializationException 이 발생한다.
     *
     * 이를 방지하기 위해 save() 직후 findByIdWithJoins() 로 재조회한다.
     * JOIN FETCH 쿼리가 module 과 user 를 같은 트랜잭션 안에서 완전히 초기화하므로
     * 반환된 Job 은 세션 종료 후에도 모든 필드를 안전하게 읽을 수 있다.
     */
    @Transactional
    public Job persistResult(Job job) {
        jobRepository.save(job);
        Job loaded = jobRepository.findByIdWithJoins(job.getId())
                .orElseThrow(() -> new EntityNotFoundException("Job", job.getId()));
        log.info("[JobPersistence] result: jobId={} status={}", loaded.getId(), loaded.getStatus());
        return loaded;
    }
}
