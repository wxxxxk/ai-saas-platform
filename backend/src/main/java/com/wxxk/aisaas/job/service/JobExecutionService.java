package com.wxxk.aisaas.job.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wxxk.aisaas.credit.service.CreditWalletService;
import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.module.entity.AiModule;
import com.wxxk.aisaas.module.enums.AiProvider;
import com.wxxk.aisaas.module.executor.AiModuleExecutor;
import com.wxxk.aisaas.module.service.AiModuleService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
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
 *   5. COMPLETED + nextModuleName 있으면 체인 Job 생성 및 dispatch
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

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final JobPersistenceService jobPersistenceService;
    private final CreditWalletService creditWalletService;
    private final AiModuleService aiModuleService;
    private final List<AiModuleExecutor> executors;
    private final ApplicationContext applicationContext;

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

                if (job.getNextModuleName() != null) {
                    dispatchChainJob(job, userId);
                }
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

    // ─── Pipeline chain dispatch ──────────────────────────────────────────────────

    private void dispatchChainJob(Job completedJob, UUID userId) {
        String nextModuleName = completedJob.getNextModuleName();
        try {
            AiModule nextModule = aiModuleService.getModuleByName(nextModuleName);
            if (!nextModule.isActive()) {
                log.warn("[JobExecution] chain skipped — module inactive: nextModule={} parentJobId={}",
                        nextModuleName, completedJob.getId());
                return;
            }

            AiProvider nextProvider = nextModule.getDefaultProvider();
            Optional<AiModuleExecutor> nextExecutorOpt = executors.stream()
                    .filter(e -> e.moduleName().equals(nextModule.getName())
                              && e.provider() == nextProvider)
                    .findFirst();

            if (nextExecutorOpt.isEmpty()) {
                log.warn("[JobExecution] chain skipped — no executor: nextModule={} provider={} parentJobId={}",
                        nextModuleName, nextProvider, completedJob.getId());
                return;
            }

            String chainInput = extractChainInput(completedJob.getOutputPayload());
            Job chainJob = jobPersistenceService.createPending(
                    userId,
                    nextModule.getId(),
                    nextProvider,
                    chainInput,
                    nextModule.getCreditCostPerCall(),
                    completedJob.getId(),
                    null
            );

            log.info("[JobExecution] chain dispatch: parentJobId={} chainJobId={} nextModule={}",
                    completedJob.getId(), chainJob.getId(), nextModuleName);

            // ApplicationContext 경유로 self-call → @Async 프록시가 적용된다
            applicationContext.getBean(JobExecutionService.class)
                    .executeJobAsync(chainJob, userId, nextExecutorOpt.get());

        } catch (Exception e) {
            log.error("[JobExecution] chain dispatch failed: parentJobId={} nextModule={} error={}",
                    completedJob.getId(), nextModuleName, e.getMessage(), e);
        }
    }

    private String extractChainInput(String outputPayload) {
        if (outputPayload == null) return "";
        try {
            JsonNode root = MAPPER.readTree(outputPayload);
            if (root.path("version").asInt() == 1) {
                JsonNode data = root.path("data");
                if (data.has("content")) return data.path("content").asText();
                if (data.has("url"))     return data.path("url").asText();
            }
        } catch (Exception ignored) {}
        return outputPayload;
    }
}
