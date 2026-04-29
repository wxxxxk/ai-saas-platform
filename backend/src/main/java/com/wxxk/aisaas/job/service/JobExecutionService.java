package com.wxxk.aisaas.job.service;

import com.wxxk.aisaas.credit.service.CreditWalletService;
import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.module.enums.AiProvider;
import com.wxxk.aisaas.module.executor.AiModuleExecutor;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * AI Job 비동기 실행 전담 서비스.
 *
 * 실행 순서:
 *   1. markRunning — DB를 RUNNING으로 즉시 갱신 (polling 클라이언트가 RUNNING을 볼 수 있게 함)
 *   2. executor.execute(job) — AI API 호출 (in-memory Job 상태 변경)
 *   3. persistResult — 최종 상태(COMPLETED / FAILED)를 DB에 저장
 *   4. FAILED인 경우 크레딧 환불
 *
 * 예외 방어:
 *   - executor 내부에서 잡히지 않은 예외가 발생하면 markFailed + refund를 시도한다.
 *   - markFailed / refund 자체가 실패하면 에러를 로그만 남기고 무시한다.
 *   - persistResult 이후에는 refund를 중복 시도하지 않는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobExecutionService {

    private final JobPersistenceService jobPersistenceService;
    private final CreditWalletService creditWalletService;

    @Async("aiTaskExecutor")
    public void executeJobAsync(Job job, UUID userId, AiModuleExecutor executor) {
        UUID jobId = job.getId();
        String moduleName = executor.moduleName();
        AiProvider provider = executor.provider();

        log.info("[JobExecution] async start: jobId={} module={} provider={} userId={}",
                jobId, moduleName, provider, userId);

        boolean persistCalled = false;
        try {
            jobPersistenceService.markRunning(jobId);

            executor.execute(job);

            persistCalled = true;
            jobPersistenceService.persistResult(job);

            if (job.getStatus() == JobStatus.FAILED) {
                creditWalletService.refund(userId, job.getCreditUsed());
                log.info("[JobExecution] credit refunded: jobId={} module={} provider={} amount={}",
                        jobId, moduleName, provider, job.getCreditUsed());
            } else {
                log.info("[JobExecution] completed: jobId={} module={} provider={} status={}",
                        jobId, moduleName, provider, job.getStatus());
            }
        } catch (Exception e) {
            log.error("[JobExecution] unexpected error: jobId={} module={} provider={} persistCalled={} error={}",
                    jobId, moduleName, provider, persistCalled, e.getMessage(), e);

            // persistResult 이전에 실패한 경우에만 markFailed + refund
            // persistResult 이후 예외는 DB에 이미 최종 상태가 저장됐으므로 markFailed를 건너뜀
            if (!persistCalled) {
                try {
                    jobPersistenceService.markFailed(jobId, "실행 중 예기치 않은 오류가 발생했습니다.");
                    creditWalletService.refund(userId, job.getCreditUsed());
                    log.info("[JobExecution] emergency refund: jobId={} amount={}", jobId, job.getCreditUsed());
                } catch (Exception ex) {
                    log.error("[JobExecution] emergency refund/markFailed failed: jobId={} error={}",
                            jobId, ex.getMessage(), ex);
                }
            }
        }
    }
}
