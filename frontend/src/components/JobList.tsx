import Link from "next/link";
import type { Job } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  RUNNING:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  FAILED:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        생성된 Job이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.1]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/[.08] bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-400">
            <th className="px-4 py-3">Job ID</th>
            <th className="px-4 py-3">Module ID</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Credits Used</th>
            <th className="px-4 py-3">Created At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[.04] bg-white dark:divide-white/[.06] dark:bg-zinc-950">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                <Link
                  href={`/jobs/${job.id}`}
                  className="underline-offset-2 hover:underline"
                >
                  {job.id.slice(0, 8)}…
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {job.moduleId.slice(0, 8)}…
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[job.status] ?? STATUS_STYLES.PENDING
                  }`}
                >
                  {job.status}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                {job.creditUsed}
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                {formatDate(job.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
