package com.wxxk.aisaas.module.executor;

import com.wxxk.aisaas.job.entity.Job;

public interface AiModuleExecutor {

    /** 이 executor가 처리하는 모듈 이름 (예: "TEXT_GENERATION") */
    String moduleName();

    /** Job을 실행하고 결과를 Asset으로 저장한다. Job 상태 전이도 이 메서드 안에서 처리한다. */
    void execute(Job job);
}
