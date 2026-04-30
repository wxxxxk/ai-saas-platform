-- Job chaining pipeline 지원을 위한 컬럼 추가
--
-- parent_job_id : 이 Job을 트리거한 부모 Job의 ID (단일 Job이면 NULL)
-- next_module_name : 완료 후 자동 실행할 모듈 이름 (없으면 NULL)
--
-- 두 컬럼 모두 NULL 허용이므로 기존 행에 영향 없음.
-- 기본값 강제 없음, NOT NULL 없음 — 하위 호환 안전.

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS parent_job_id    UUID          NULL,
    ADD COLUMN IF NOT EXISTS next_module_name VARCHAR(100)  NULL;

-- parent_job_id 기준 자식 Job 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_jobs_parent_job_id ON jobs (parent_job_id);
