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
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final AiModuleService aiModuleService;
    private final CreditWalletService creditWalletService;  // 크레딧 차감 위임
    private final List<AiModuleExecutor> executors;

    @Transactional
    public Job createJob(UUID userId, UUID moduleId, String inputPayload) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        AiModule module = aiModuleService.getModuleById(moduleId);

        if (!module.isActive()) {
            throw new InactiveModuleException(module.getName());
        }

        // 잔액 확인 및 차감을 CreditWalletService에 위임
        creditWalletService.deduct(userId, module.getCreditCostPerCall());

        Job job = Job.builder()
                .user(user)
                .module(module)
                .status(JobStatus.PENDING)
                .inputPayload(inputPayload)
                .creditUsed(module.getCreditCostPerCall())
                .build();

        Job saved = jobRepository.save(job);

        executors.stream()
                .filter(e -> e.moduleName().equals(module.getName()))
                .findFirst()
                .ifPresent(e -> e.execute(saved));

        return saved;
    }

    @Transactional
    public Job startJob(UUID jobId) {
        Job job = getJobById(jobId);
        job.start();
        return job;
    }

    @Transactional
    public Job completeJob(UUID jobId, String outputPayload) {
        Job job = getJobById(jobId);
        job.complete(outputPayload);
        return job;
    }

    @Transactional
    public Job failJob(UUID jobId, String errorMessage) {
        Job job = getJobById(jobId);
        job.fail(errorMessage);
        return job;
    }

    @Transactional
    public Job cancelJob(UUID jobId) {
        Job job = getJobById(jobId);
        job.cancel();
        return job;
    }

    @Transactional(readOnly = true)
    public Job getJobById(UUID jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Job", jobId));
    }

    @Transactional(readOnly = true)
    public List<Job> getJobsByUserId(UUID userId) {
        return jobRepository.findAllByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<Job> getJobsByUserIdAndStatus(UUID userId, JobStatus status) {
        return jobRepository.findAllByUserIdAndStatus(userId, status);
    }
}
