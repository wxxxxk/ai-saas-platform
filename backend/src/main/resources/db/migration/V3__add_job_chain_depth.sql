-- Job chain 무한 루프 방지를 위한 depth 컬럼 추가
--
-- chain_depth : 체인 내 깊이 (단일 Job=0, 첫 번째 child=1, ...)
--
-- NOT NULL DEFAULT 0 — PostgreSQL 11+에서 기존 행 즉시 백필, 테이블 재작성 없음.
-- 기존 Job은 모두 단일 Job(depth=0)이므로 DEFAULT 0이 의미상 정확하다.

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS chain_depth INTEGER NOT NULL DEFAULT 0;
