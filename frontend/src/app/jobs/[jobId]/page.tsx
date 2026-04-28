export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCookieStore } from "@/lib/fetch";
import { getJob, getJobs, JobAuthError, JobNotFoundError } from "@/lib/api";
import type { Job } from "@/lib/api";
import JobLiveView from "@/components/JobLiveView";

// ─── 페이지 ──────────────────────────────────────────────────────────────────

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const cookieStore = await getCookieStore();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return <AuthErrorPage />;
  }

  let job: Job | null = null;
  let authError = false;

  try {
    job = await getJob(jobId);
  } catch (e) {
    if (e instanceof JobNotFoundError) notFound();
    if (e instanceof JobAuthError) { authError = true; }
    else throw e;
  }

  if (authError || !job) {
    return <AuthErrorPage />;
  }

  // ─── 관련 결과 조회 ───────────────────────────────────────────────────────────
  // cookies() 동시 호출 경합 방지를 위해 getJob() 이후 순차 실행한다.
  // 같은 moduleName + inputPayload를 가진 다른 Job들을 "변형(variation)"으로 취급한다.
  // inputPayload가 null이면 그룹화 의미가 없으므로 건너뛴다.

  let relatedJobs: Job[] = [];
  if (job.inputPayload) {
    try {
      const allJobs = await getJobs();
      relatedJobs = allJobs
        .filter(
          (j) =>
            j.id !== jobId &&
            j.moduleName === job!.moduleName &&
            j.inputPayload === job!.inputPayload
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 9); // 현재 + 최대 9개 = 10개까지 표시
    } catch {
      // 관련 결과 조회 실패는 비치명적 — 기본값 빈 배열 유지
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-7">

      {/* 브레드크럼 */}
      <nav>
        <Link
          href="/jobs"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors group"
        >
          <svg
            className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          히스토리
        </Link>
      </nav>

      {/* 동적 워크스페이스 — 폴링 포함 */}
      <JobLiveView initialJob={job} relatedJobs={relatedJobs} />

    </div>
  );
}

// ─── 인증 오류 페이지 ────────────────────────────────────────────────────────

function AuthErrorPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <Link
        href="/jobs"
        prefetch={false}
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
      >
        ← 히스토리
      </Link>
      <div className="rounded-xl border border-border bg-surface-low px-6 py-10 text-center space-y-3">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">접근 권한이 없습니다</p>
        <p className="text-xs text-zinc-600">
          세션이 만료되었거나 이 작업에 접근할 권한이 없습니다.
        </p>
        <Link
          href="/login"
          className="mt-2 inline-block rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
        >
          다시 로그인
        </Link>
      </div>
    </div>
  );
}
