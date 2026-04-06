import Link from "next/link";
import { getAssets, getJob } from "@/lib/api";
import type { Asset, Job } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  RUNNING:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  FAILED:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

const MODULE_BADGE: Record<string, string> = {
  IMAGE_GENERATION: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  TEXT_GENERATION:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  SUMMARIZATION:    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  TRANSLATION:      "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3.5 border-b border-black/[.05] dark:border-white/[.06] last:border-0">
      <dt className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-sm text-zinc-800 dark:text-zinc-200 break-all">{value}</dd>
    </div>
  );
}

function TextResult({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 p-5">
      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function ImageResult({ assets }: { assets: Asset[] }) {
  const images = assets.filter(
    (a) => a.fileType.startsWith("image/") && a.storageKey.startsWith("http")
  );
  if (images.length === 0) return null;

  return (
    <div className="space-y-4">
      {images.map((asset) => (
        <div key={asset.id} className="rounded-xl overflow-hidden border border-black/[.08] dark:border-white/[.1]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={asset.storageKey}
            alt={asset.fileName}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}

function ResultSection({ job, assets }: { job: Job; assets: Asset[] }) {
  if (job.status !== "COMPLETED") return null;

  const isImage = job.moduleName === "IMAGE_GENERATION";
  const isText = job.moduleName === "TEXT_GENERATION" || job.moduleName === "SUMMARIZATION" || job.moduleName === "TRANSLATION";

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
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
  const [job, assets] = await Promise.all([getJob(jobId), getAssets(jobId)]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* 네비게이션 */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Job Detail
        </h1>
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            STATUS_STYLES[job.status] ?? STATUS_STYLES.PENDING
          }`}
        >
          {job.status}
        </span>
      </div>

      {/* 실패 메시지 */}
      {job.status === "FAILED" && job.errorMessage && (
        <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Error</p>
          <p className="text-sm text-red-700 dark:text-red-300 break-all">{job.errorMessage}</p>
        </div>
      )}

      {/* Job 메타 정보 */}
      <div className="rounded-xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 px-5">
        <dl>
          <Row
            label="Module"
            value={
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  MODULE_BADGE[job.moduleName] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
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
                <span className="text-zinc-700 dark:text-zinc-300">{job.inputPayload}</span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-600 italic">없음</span>
              )
            }
          />
          <Row label="Credits Used" value={`${job.creditUsed} cr`} />
          <Row
            label="Created"
            value={new Date(job.createdAt).toLocaleString("ko-KR", {
              year: "numeric", month: "2-digit", day: "2-digit",
              hour: "2-digit", minute: "2-digit", second: "2-digit",
            })}
          />
          <Row label="Job ID" value={<span className="font-mono text-xs text-zinc-400">{job.id}</span>} />
        </dl>
      </div>

      {/* 생성 결과 */}
      <ResultSection job={job} assets={assets} />
    </div>
  );
}
