export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCookieStore } from "@/lib/fetch";
import { getJob, JobAuthError, JobNotFoundError } from "@/lib/api";
import type { Job } from "@/lib/api";
import CopyButton from "@/components/CopyButton";
import ImagePreview from "@/components/ImagePreview";

// ─── 상태별 스타일 ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  PENDING:   { dot: "bg-zinc-500",  badge: "bg-zinc-800 text-zinc-400",                         label: "PENDING"   },
  RUNNING:   { dot: "bg-blue-400 animate-pulse", badge: "bg-blue-900/40 text-blue-400",         label: "RUNNING"   },
  COMPLETED: { dot: "bg-green-500", badge: "bg-green-900/40 text-green-400",                    label: "COMPLETED" },
  FAILED:    { dot: "bg-red-500",   badge: "bg-red-900/40 text-red-400",                        label: "FAILED"    },
  CANCELLED: { dot: "bg-zinc-500",  badge: "bg-zinc-800 text-zinc-500",                         label: "CANCELLED" },
};

const MODULE_STYLE: Record<string, { badge: string; label: string }> = {
  IMAGE_GENERATION: { badge: "bg-purple-900/40 text-purple-300", label: "Image Generation" },
  TEXT_GENERATION:  { badge: "bg-emerald-900/40 text-emerald-300", label: "Text Generation"  },
  SUMMARIZATION:    { badge: "bg-orange-900/40 text-orange-300", label: "Summarization"    },
  TRANSLATION:      { badge: "bg-sky-900/40 text-sky-300",        label: "Translation"      },
};

// ─── 페이지 ────────────────────────────────────────────────────────────────────

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const cookieStore = await getCookieStore();
  const token = cookieStore.get("auth_token")?.value;

  console.log(`[JobDetailPage] jobId=${jobId} hasToken=${!!token}`);

  if (!token) {
    return <ErrorPage message="세션이 만료되었습니다. 다시 로그인해 주세요." />;
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
    return <ErrorPage message="이 Job에 접근할 권한이 없습니다." />;
  }

  const statusCfg = STATUS_STYLE[job.status] ?? STATUS_STYLE.PENDING;
  const moduleCfg = MODULE_STYLE[job.moduleName] ?? { badge: "bg-zinc-800 text-zinc-400", label: job.moduleName };
  const isImage = job.moduleName === "IMAGE_GENERATION";
  const isCompleted = job.status === "COMPLETED";
  const isFailed = job.status === "FAILED";
  const isInProgress = job.status === "PENDING" || job.status === "RUNNING";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">

      {/* 뒤로 가기 */}
      <Link
        href="/dashboard"
        prefetch={false}
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        ← Dashboard
      </Link>

      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold text-zinc-50 font-headline">Job Detail</h1>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${moduleCfg.badge}`}>
          {moduleCfg.label}
        </span>
      </div>

      {/* 프롬프트 카드 */}
      {job.inputPayload && (
        <section className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Prompt</p>
          <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{job.inputPayload}</p>
        </section>
      )}

      {/* 진행 중 표시 */}
      {isInProgress && (
        <section className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-5 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
          <p className="text-sm text-blue-400">
            {job.status === "PENDING" ? "Job이 대기 중입니다…" : "AI가 생성 중입니다…"}
          </p>
        </section>
      )}

      {/* 결과 카드 (COMPLETED) */}
      {isCompleted && job.outputPayload && (
        <section className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Output</p>
            {!isImage && <CopyButton text={job.outputPayload} />}
          </div>

          {isImage ? (
            <ImagePreview src={job.outputPayload} />
          ) : (
            <div className="rounded-lg bg-[#131316] border border-white/[.06] p-4">
              <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{job.outputPayload}</p>
            </div>
          )}
        </section>
      )}

      {/* 에러 카드 (FAILED) */}
      {isFailed && (
        <section className="rounded-xl border border-red-900/40 bg-red-950/20 p-5 space-y-2">
          <p className="text-xs font-medium text-red-500 uppercase tracking-wider">Error</p>
          <p className="text-sm text-red-400 leading-relaxed">
            {job.errorMessage ?? "알 수 없는 오류가 발생했습니다."}
          </p>
        </section>
      )}

      {/* 메타데이터 */}
      <section className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5 py-2 space-y-0">
        <MetaRow label="Job ID"   value={<code className="text-xs text-zinc-400 break-all">{job.id}</code>} />
        <MetaRow label="Credits"  value={`${job.creditUsed} cr`} />
        <MetaRow label="Created"  value={formatDate(job.createdAt)} />
      </section>
    </div>
  );
}

// ─── 에러 페이지 ──────────────────────────────────────────────────────────────

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <Link href="/dashboard" prefetch={false} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
        ← Dashboard
      </Link>
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  );
}

// ─── 유틸 컴포넌트 ────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3.5 border-b border-white/[.06] last:border-0">
      <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-zinc-400">{value}</dd>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}
