package com.wxxk.aisaas.job.controller;

import com.wxxk.aisaas.job.dto.CreateJobRequest;
import com.wxxk.aisaas.job.dto.JobResponse;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.job.service.JobService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @PostMapping
    public ResponseEntity<JobResponse> createJob(@Valid @RequestBody CreateJobRequest request) {
        JobResponse response = JobResponse.from(
                jobService.createJob(request.getUserId(), request.getModuleId(), request.getInputPayload())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<JobResponse>> getJobs(
            @RequestParam UUID userId,
            @RequestParam(required = false) JobStatus status) {
        List<JobResponse> response = (status != null
                ? jobService.getJobsByUserIdAndStatus(userId, status)
                : jobService.getJobsByUserId(userId))
                .stream()
                .map(JobResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JobResponse> getJob(@PathVariable UUID jobId) {
        return ResponseEntity.ok(JobResponse.from(jobService.getJobById(jobId)));
    }
}
