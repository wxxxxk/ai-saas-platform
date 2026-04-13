export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAssets, getJob, JobAuthError, JobNotFoundError } from "@/lib/api";
import type { Asset, Job } from "@/lib/api";
import ImagePreview from "@/components/ImagePreview";

const STATUS_CONFIG: Record<
  string,
  { dot: string; badge: string; label: string; pulse?: boolean }
> = {
  PENDING:   { dot: "bg-zinc-400",  badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",        label: "PENDING"   },
  RUNNING:   { dot: "bg-blue-500",  badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",     label: "RUNNING",  pulse: true },
  COMPLETED: { dot: "bg-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", label: "COMPLETED" },
  FAILED:    { dot: "bg-red-500",   badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",         label: "FAILED"    },
  CANCELLED: { dot: "bg-zinc-400",  badge: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",        label: "CANCELLED" },
};

const MODULE_BADGE: Record<string, string> = {
  IMAGE_GENERATION: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  TEXT_GENERATION:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  SUMMARIZATION:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  TRANSLATION:      "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3.5 border-b border-white/[.06] last:border-0">
      <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-sm text-zinc-200 break-all">{value}</dd>
    </div>
  );
}

function TextResult({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/[.07] bg-[#1f1f22] flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-medium text-zinc-400">Generated Text</span>
      </div>
      <div className="p-5">
        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}

function ImageResult({ assets }: { assets: Asset[] }) {
  const images = assets.filter(
    (a) => a.fileType.startsWith("image/") && a.storageKey.startsWith("http")
  );

  if (images.length === 0) {
    return (
      <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5">
        <p className="text-sm text-zinc-500">
          이미지 Asset이 아직 없습니다. (assets: {assets.length}개,{" "}
          {assets.map((a) => `fileType=${a.fileType}`).join(", ") || "없음"})
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {images.map((asset) => (
        <div
          key={asset.id}
          className="rounded-xl overflow-hidden border border-white/[.08] bg-[#1b1b1e]"
        >
          <div className="px-4 py-2.5 border-b border-white/[.07] bg-[#1f1f22] flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-xs font-medium text-zinc-400">Generated Image</span>
          </div>
          <ImagePreview src={asset.storageKey} alt={asset.fileName} />
        </div>
      ))}
    </div>
  );
}

function ResultSection({ job, assets }: { job: Job; assets: Asset[] }) {
  if (job.status !== "COMPLETED") return null;

  const isImage = job.moduleName === "IMAGE_GENERATION";
  const isText =
    job.moduleName === "TEXT_GENERATION" ||
    job.moduleName === "SUMMARIZATION" ||
    job.moduleName === "TRANSLATION";

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-zinc-50 font-headline mb-3">
        Generated Result
      </h2>
      {isImage && <ImageResult assets={assets} />}
      {isText && job.outputPayload && <TextResult text={job.outputPayload} />}
    </section>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  let job: Job;
  try {
    job = await getJob(jobId);
  } catch (e) {
    if (e instanceof JobNotFoundError) notFound();
    // 401: 세션 만료 또는 인증 정보 없음 → 쿠키 삭제 후 로그인 페이지로
    if (e instanceof JobAuthError) redirect("/api/auth/logout");
    throw e;
  }

  // assets 실패는 job 자체와 무관하므로 빈 배열로 graceful 처리
  const assets = await getAssets(jobId).catch(() => []);

  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* 네비게이션 */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50 font-headline">Job Detail</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.badge}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} ${
              statusCfg.pulse ? "animate-pulse" : ""
            }`}
          />
          {statusCfg.label}
        </span>
      </div>

      {/* 실패 메시지 */}
      {job.status === "FAILED" && (
        <div className="mb-6 rounded-xl border-2 border-red-900/60 bg-red-950/30 px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">
            Job Failed
          </p>
          <p className="text-sm text-red-300 leading-relaxed">
            {job.errorMessage ?? "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."}
          </p>
          {job.moduleName === "IMAGE_GENERATION" && (
            <p className="text-xs text-red-400/70 leading-relaxed">
              표현을 완화하거나 더 중립적인 프롬프트로 다시 시도해 보세요.
              예: 자연 풍경, 건축물, 추상적 패턴, 음식 등 중립적인 주제를 권장합니다.
            </p>
          )}
          <div className="pt-1">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-red-400 hover:underline"
            >
              ← 대시보드로 돌아가서 다시 시도
            </Link>
          </div>
        </div>
      )}

      {/* Job 메타 정보 */}
      <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5">
        <dl>
          <Row
            label="Module"
            value={
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  MODULE_BADGE[job.moduleName] ??
                  "bg-zinc-800 text-zinc-400"
                }`}
              >
                {job.moduleName}
              </span>
            }
          />
          <Row
            label="Prompt"
            value={
              job.inputPayload ? (
                <span className="text-zinc-300">{job.inputPayload}</span>
              ) : (
                <span className="text-zinc-600 italic">없음</span>
              )
            }
          />
          <Row label="Credits Used" value={<span className="tabular-nums">{job.creditUsed} cr</span>} />
          <Row
            label="Created"
            value={new Date(job.createdAt).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          />
          <Row
            label="Job ID"
            value={<span className="font-mono text-xs text-zinc-400">{job.id}</span>}
          />
        </dl>
      </div>

      {/* 생성 결과 */}
      <ResultSection job={job} assets={assets} />

      {/* 개발용 디버그 섹션 */}
      {process.env.NODE_ENV === "development" && (
        <details className="mt-8 rounded-xl border border-dashed border-zinc-700 p-4">
          <summary className="text-xs font-medium text-zinc-500 cursor-pointer select-none">
            🛠 Debug: Assets ({assets.length}개)
          </summary>
          <div className="mt-3 space-y-2">
            {assets.length === 0 ? (
              <p className="text-xs text-zinc-500">Asset 없음</p>
            ) : (
              assets.map((a) => (
                <div key={a.id} className="text-xs text-zinc-400 space-y-0.5">
                  <p><span className="font-mono text-zinc-300">fileType:</span> {a.fileType}</p>
                  <p><span className="font-mono text-zinc-300">storageKey starts with http:</span> {String(a.storageKey?.startsWith("http"))}</p>
                  <p><span className="font-mono text-zinc-300">storageKey length:</span> {a.storageKey?.length ?? 0}</p>
                </div>
              ))
            )}
          </div>
        </details>
      )}
    </div>
  );
}
