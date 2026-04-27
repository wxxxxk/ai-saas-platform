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
     * executor가 in-memory로 변경한 Job 엔티티를 DB에 반영한다.
     * merge() 의미론(detached → managed)으로 처리된다.
     */
    @Transactional
    public Job persistResult(Job job) {
        Job saved = jobRepository.save(job);
        log.info("[JobPersistence] result: jobId={} status={}", saved.getId(), saved.getStatus());
        return saved;
    }
}
