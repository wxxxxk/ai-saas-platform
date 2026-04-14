export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCookieStore } from "@/lib/fetch";
import { getJob, JobAuthError, JobNotFoundError } from "@/lib/api";
import type { Job } from "@/lib/api";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  // 이 async 컨텍스트에서 쿠키를 직접 읽어 토큰을 확인한다.
  // layout의 getSessionUser()와 page의 getJob()이 concurrent하게 렌더될 때
  // React.cache가 두 컨텍스트를 공유하지 못하면 cookies()가 빈 값을 반환하는 경합이 발생한다.
  // 페이지 최상단에서 getCookieStore()를 명시적으로 호출해 캐시를 현재 컨텍스트에서 초기화한다.
  const cookieStore = await getCookieStore();
  const token = cookieStore.get("auth_token")?.value;

  console.log(`[JobDetailPage] jobId=${jobId} hasToken=${!!token}`);

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/dashboard" prefetch={false} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
            ← Dashboard
          </Link>
        </div>
        <p className="text-sm text-zinc-400">세션이 만료되었습니다. 다시 로그인해 주세요.</p>
      </div>
    );
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
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href="/dashboard" prefetch={false} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
            ← Dashboard
          </Link>
        </div>
        <p className="text-sm text-zinc-400">이 Job에 접근할 권한이 없습니다.</p>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    PENDING: "PENDING",
    RUNNING: "RUNNING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link
          href="/dashboard"
          prefetch={false}
          className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50 font-headline">Job Detail</h1>
        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-300">
          {statusLabel[job.status] ?? job.status}
        </span>
      </div>

      <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5 py-2 space-y-0">
        <Row label="Job ID"     value={<code className="text-xs text-zinc-400">{job.id}</code>} />
        <Row label="Module"     value={job.moduleName} />
        <Row label="Status"     value={job.status} />
        <Row label="Credits"    value={`${job.creditUsed} cr`} />
        <Row label="Prompt"     value={job.inputPayload ?? "—"} />
        {job.outputPayload && (
          <Row label="Output" value={
            job.outputPayload.startsWith("http")
              ? <a href={job.outputPayload} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">{job.outputPayload}</a>
              : <span className="whitespace-pre-wrap">{job.outputPayload}</span>
          } />
        )}
        {job.status === "FAILED" && job.errorMessage && (
          <Row label="Error" value={<span className="text-red-400">{job.errorMessage}</span>} />
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3.5 border-b border-white/[.06] last:border-0">
      <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-zinc-200 break-all">{value}</dd>
    </div>
  );
}
