package com.wxxk.aisaas.job.controller;

import com.wxxk.aisaas.job.entity.Job;
import com.wxxk.aisaas.job.enums.JobStatus;
import com.wxxk.aisaas.job.service.JobService;
import java.util.List;
import java.util.Map;
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
    public ResponseEntity<Job> createJob(@RequestBody Map<String, String> body) {
        UUID userId = UUID.fromString(body.get("userId"));
        UUID moduleId = UUID.fromString(body.get("moduleId"));
        String inputPayload = body.get("inputPayload");

        Job job = jobService.createJob(userId, moduleId, inputPayload);
        return ResponseEntity.status(HttpStatus.CREATED).body(job);
    }

    @GetMapping
    public ResponseEntity<List<Job>> getJobs(
            @RequestParam UUID userId,
            @RequestParam(required = false) JobStatus status) {
        if (status != null) {
            return ResponseEntity.ok(jobService.getJobsByUserIdAndStatus(userId, status));
        }
        return ResponseEntity.ok(jobService.getJobsByUserId(userId));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<Job> getJob(@PathVariable UUID jobId) {
        return ResponseEntity.ok(jobService.getJobById(jobId));
    }
}
