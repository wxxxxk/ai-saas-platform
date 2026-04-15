export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCookieStore } from "@/lib/fetch";
import { getJob, getJobs, JobAuthError, JobNotFoundError } from "@/lib/api";
import type { Job } from "@/lib/api";
import CopyButton from "@/components/CopyButton";
import ImagePreview from "@/components/ImagePreview";
import DownloadButton from "@/components/DownloadButton";
import EditPromptForm from "@/components/EditPromptForm";
import RelatedResults from "@/components/RelatedResults";

// ─── 스타일 설정 ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  PENDING:   { dot: "bg-zinc-500",               badge: "bg-zinc-800 text-zinc-400",        label: "대기 중" },
  RUNNING:   { dot: "bg-blue-400 animate-pulse", badge: "bg-blue-900/40 text-blue-400",     label: "생성 중" },
  COMPLETED: { dot: "bg-green-500",              badge: "bg-green-900/40 text-green-400",   label: "완료"    },
  FAILED:    { dot: "bg-red-500",                badge: "bg-red-900/40 text-red-400",       label: "실패"    },
  CANCELLED: { dot: "bg-zinc-600",               badge: "bg-zinc-800 text-zinc-500",        label: "취소됨"  },
};

const MODULE_STYLE: Record<string, { badge: string; label: string }> = {
  IMAGE_GENERATION: { badge: "bg-purple-900/40 text-purple-300",  label: "Image Generation" },
  TEXT_GENERATION:  { badge: "bg-emerald-900/40 text-emerald-300", label: "Text Generation"  },
  SUMMARIZATION:    { badge: "bg-orange-900/40 text-orange-300",  label: "Summarization"    },
  TRANSLATION:      { badge: "bg-sky-900/40 text-sky-300",        label: "Translation"      },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year:   "numeric",
    month:  "long",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

// ─── 헬퍼 컴포넌트 ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
      {children}
    </p>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5">
      <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── 진행 중 표시 ─────────────────────────────────────────────────────────────

function InProgressSection({
  status,
  jobId,
}: {
  status: string;
  jobId: string;
}) {
  const isRunning = status === "RUNNING";
  return (
    <div
      className={`rounded-xl border p-8 flex flex-col items-center gap-5 text-center ${
        isRunning
          ? "border-blue-900/40 bg-blue-950/20"
          : "border-white/[.08] bg-[#1b1b1e]"
      }`}
    >
      <span
        className={`h-10 w-10 rounded-full border-[3px] animate-spin ${
          isRunning
            ? "border-blue-900 border-t-blue-400"
            : "border-zinc-800 border-t-zinc-500"
        }`}
      />
      <div className="space-y-1.5">
        <p
          className={`text-sm font-semibold ${
            isRunning ? "text-blue-300" : "text-zinc-300"
          }`}
        >
          {isRunning ? "AI가 콘텐츠를 생성하고 있습니다" : "처리 대기 중입니다"}
        </p>
        <p className="text-xs text-zinc-600 leading-relaxed max-w-xs">
          {isRunning
            ? "완료되면 결과가 이 페이지에 표시됩니다. 새로고침으로 최신 상태를 확인하세요."
            : "요청이 접수되었습니다. 처리가 곧 시작됩니다."}
        </p>
      </div>
      {/* 같은 URL로 이동 → force-dynamic이므로 항상 최신 상태 반환 */}
      <Link
        href={`/jobs/${jobId}`}
        prefetch={false}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[.1] bg-white/[.04] px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[.08] transition-colors"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        새로고침
      </Link>
    </div>
  );
}

// ─── 실패 결과 표시 ──────────────────────────────────────────────────────────

function FailedSection({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
        <p className="text-sm font-semibold text-red-400">생성에 실패했습니다</p>
      </div>
      {errorMessage ? (
        <p className="text-xs text-red-400/80 leading-relaxed pl-4 border-l border-red-900/50">
          {errorMessage}
        </p>
      ) : (
        <p className="text-xs text-red-500/60 pl-4">
          알 수 없는 오류가 발생했습니다.
        </p>
      )}
      <p className="text-xs text-zinc-600 pt-1">
        오른쪽에서 프롬프트를 수정하거나 동일한 내용으로 다시 시도해 보세요.
      </p>
    </div>
  );
}

// ─── 텍스트 결과 표시 ────────────────────────────────────────────────────────

function TextResultSection({ text }: { text: string }) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 space-y-4">
      <div className="rounded-lg bg-[#131316] border border-white/[.05] p-5">
        <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-7">
          {text}
        </p>
      </div>
      {/* 텍스트 통계 */}
      <div className="flex items-center gap-4 text-xs text-zinc-700 tabular-nums">
        <span>{wordCount.toLocaleString()} 단어</span>
        <span>·</span>
        <span>{charCount.toLocaleString()} 자</span>
      </div>
    </div>
  );
}

// ─── 사이드바: 상태 섹션 ─────────────────────────────────────────────────────

function SidebarStatus({ job }: { job: Job }) {
  const cfg = STATUS_STYLE[job.status] ?? STATUS_STYLE.PENDING;

  if (job.status === "RUNNING" || job.status === "PENDING") {
    const isRunning = job.status === "RUNNING";
    return (
      <SidebarSection title="상태">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 animate-spin ${
              isRunning
                ? "border-blue-900 border-t-blue-400"
                : "border-zinc-800 border-t-zinc-500"
            }`}
          />
          <div className="space-y-0.5">
            <p
              className={`text-sm font-semibold ${
                isRunning ? "text-blue-400" : "text-zinc-300"
              }`}
            >
              {cfg.label}
            </p>
            <p className="text-xs text-zinc-600">
              {isRunning ? "처리 중입니다" : "처리 대기 중입니다"}
            </p>
          </div>
        </div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="상태">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
        <span className="text-sm font-semibold text-zinc-300">{cfg.label}</span>
      </div>
    </SidebarSection>
  );
}

// ─── 사이드바: 액션 섹션 (COMPLETED) ─────────────────────────────────────────

function SidebarActions({
  job,
  isImage,
}: {
  job: Job;
  isImage: boolean;
}) {
  if (job.status !== "COMPLETED" || !job.outputPayload) return null;

  return (
    <SidebarSection title="결과 저장">
      <div className="flex flex-col items-start gap-2">
        {isImage ? (
          <DownloadButton url={job.outputPayload} />
        ) : (
          <CopyButton text={job.outputPayload} />
        )}
      </div>
    </SidebarSection>
  );
}

// ─── 사이드바: 계속 작업하기 ─────────────────────────────────────────────────

function SidebarContinue({
  job,
  label,
  relatedCount = 0,
}: {
  job: Job;
  label: string;
  relatedCount?: number;
}) {
  if (!job.inputPayload) return null;

  return (
    <SidebarSection title={label}>
      <EditPromptForm
        moduleId={job.moduleId}
        initialPrompt={job.inputPayload}
        creditCost={job.creditUsed}
      />
      {relatedCount > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600 border-t border-white/[.05] pt-3">
          이 프롬프트로 만든 결과가{" "}
          <span className="font-semibold text-zinc-500">{relatedCount}개</span> 더 있습니다.{" "}
          <span className="text-zinc-600">페이지 아래에서 비교해 보세요 ↓</span>
        </p>
      )}
    </SidebarSection>
  );
}

// ─── 사이드바: 상세 정보 ──────────────────────────────────────────────────────

function SidebarDetails({ job }: { job: Job }) {
  return (
    <SidebarSection title="상세 정보">
      <dl className="space-y-3">
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">생성 시각</dt>
          <dd className="text-xs text-zinc-400 tabular-nums">{formatDate(job.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">소모 크레딧</dt>
          <dd className="text-xs text-zinc-400 tabular-nums">{job.creditUsed} cr</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">Job ID</dt>
          <dd>
            <code className="text-xs text-zinc-600 break-all leading-relaxed">
              {job.id}
            </code>
          </dd>
        </div>
      </dl>
    </SidebarSection>
  );
}

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
            j.moduleName === job.moduleName &&
            j.inputPayload === job.inputPayload
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

  // ─── 파생 상태 ──────────────────────────────────────────────────────────────

  const isImage      = job.moduleName === "IMAGE_GENERATION";
  const isCompleted  = job.status === "COMPLETED";
  const isFailed     = job.status === "FAILED";
  const isInProgress = job.status === "PENDING" || job.status === "RUNNING";
  const hasOutput    = isCompleted && !!job.outputPayload;
  const hasPrompt    = !!job.inputPayload;

  const statusCfg = STATUS_STYLE[job.status] ?? STATUS_STYLE.PENDING;
  const moduleCfg = MODULE_STYLE[job.moduleName] ?? {
    badge: "bg-zinc-800 text-zinc-400",
    label: job.moduleName,
  };

  // 상태에 따른 페이지 타이틀
  const pageTitle = isInProgress
    ? "생성 중…"
    : isFailed
      ? "생성 실패"
      : isImage
        ? "이미지 결과"
        : "텍스트 결과";

  // ─── 렌더 ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-7">

      {/* 브레드크럼 */}
      <nav>
        <Link
          href="/jobs"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors group"
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

      {/* 페이지 헤더 */}
      <header className="space-y-2">
        {/* 배지 행 */}
        <div className="flex items-center flex-wrap gap-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${moduleCfg.badge}`}
          >
            {moduleCfg.label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.badge}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusCfg.dot}`}
            />
            {statusCfg.label}
          </span>
        </div>

        {/* 타이틀 */}
        <h1 className="text-2xl font-semibold text-zinc-50 font-headline leading-tight">
          {pageTitle}
        </h1>

        {/* 생성 시각 */}
        <time className="block text-xs text-zinc-600 tabular-nums">
          {formatDate(job.createdAt)}
        </time>
      </header>

      {/* ─── 2단 워크스페이스 레이아웃 ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_288px] gap-6 items-start">

        {/* ── 메인 콘텐츠 영역 ── */}
        <div className="space-y-5 min-w-0">

          {/* 프롬프트 섹션 */}
          {hasPrompt && (
            <section>
              <SectionLabel>Your Prompt</SectionLabel>
              <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5 py-4">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {job.inputPayload}
                </p>
              </div>
            </section>
          )}

          {/* 결과 섹션 */}
          <section>
            <SectionLabel>
              {isInProgress
                ? "Processing"
                : isFailed
                  ? "Error"
                  : isImage
                    ? "Generated Image"
                    : "Generated Text"}
            </SectionLabel>

            {/* 진행 중 */}
            {isInProgress && (
              <InProgressSection status={job.status} jobId={jobId} />
            )}

            {/* 실패 */}
            {isFailed && (
              <FailedSection errorMessage={job.errorMessage} />
            )}

            {/* 텍스트 결과 */}
            {hasOutput && !isImage && (
              <TextResultSection text={job.outputPayload!} />
            )}

            {/* 이미지 결과 */}
            {hasOutput && isImage && (
              <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5">
                <ImagePreview src={job.outputPayload!} />
              </div>
            )}

            {/* 완료이지만 outputPayload 없음 (엣지 케이스) */}
            {isCompleted && !job.outputPayload && (
              <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5 py-8 text-center">
                <p className="text-sm text-zinc-500">결과 데이터가 없습니다.</p>
              </div>
            )}
          </section>
        </div>

        {/* ── 사이드바 (sticky) ── */}
        <aside className="space-y-4 lg:sticky lg:top-8">

          {/* 상태 */}
          <SidebarStatus job={job} />

          {/* 결과 저장 (COMPLETED일 때만) */}
          <SidebarActions job={job} isImage={isImage} />

          {/* 계속 작업하기 / 다시 시도 */}
          {isCompleted && hasPrompt && (
            <SidebarContinue
              job={job}
              label="계속 작업하기"
              relatedCount={relatedJobs.length}
            />
          )}
          {isFailed && hasPrompt && (
            <SidebarContinue
              job={job}
              label="다시 시도"
              relatedCount={relatedJobs.length}
            />
          )}

          {/* 상세 정보 */}
          <SidebarDetails job={job} />

          {/* 히스토리로 돌아가기 링크 */}
          <Link
            href="/jobs"
            prefetch={false}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[.07] bg-transparent px-4 py-3 text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/[.04] transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 10h16M4 14h8"
              />
            </svg>
            전체 히스토리 보기
          </Link>

        </aside>
      </div>

      {/* ─── 관련 결과 비교 섹션 ─────────────────────────────────────────────── */}
      {relatedJobs.length > 0 && (
        <RelatedResults currentJob={job} relatedJobs={relatedJobs} />
      )}

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
        className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        ← 히스토리
      </Link>
      <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-6 py-10 text-center space-y-3">
        <p className="text-sm font-medium text-zinc-300">접근 권한이 없습니다</p>
        <p className="text-xs text-zinc-600">
          세션이 만료되었거나 이 작업에 접근할 권한이 없습니다.
        </p>
        <Link
          href="/login"
          className="mt-2 inline-block rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors"
        >
          다시 로그인
        </Link>
      </div>
    </div>
  );
}
