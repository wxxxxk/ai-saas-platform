import Link from "next/link";
import { getJob } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  RUNNING:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  FAILED:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-4 border-b border-black/[.06] dark:border-white/[.08] last:border-0">
      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm text-zinc-800 dark:text-zinc-200 break-all">{value}</dd>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        Job Detail
      </h1>

      <div className="rounded-xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-950 px-6">
        <dl>
          <Row label="Job ID" value={<span className="font-mono">{job.id}</span>} />
          <Row
            label="Status"
            value={
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[job.status] ?? STATUS_STYLES.PENDING
                }`}
              >
                {job.status}
              </span>
            }
          />
          <Row label="Credits Used" value={job.creditUsed} />
          <Row label="User ID" value={<span className="font-mono">{job.userId}</span>} />
          <Row label="Module ID" value={<span className="font-mono">{job.moduleId}</span>} />
          <Row
            label="Input Payload"
            value={
              job.inputPayload ? (
                <span className="font-mono">{job.inputPayload}</span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-600 italic">없음</span>
              )
            }
          />
          <Row
            label="Created At"
            value={new Date(job.createdAt).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          />
        </dl>
      </div>
    </div>
  );
}
