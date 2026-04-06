import Link from "next/link";
import type { Job } from "@/lib/api";

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

const MODULE_LABEL: Record<string, string> = {
  IMAGE_GENERATION: "Image",
  TEXT_GENERATION:  "Text",
  SUMMARIZATION:    "Summary",
  TRANSLATION:      "Translate",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 px-6 py-12 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          아직 실행된 Job이 없습니다.
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
          위 모듈에서 프롬프트를 입력하고 Generate를 눌러보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.1]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/[.08] dark:border-white/[.1] bg-zinc-50 dark:bg-zinc-900 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Prompt</th>
            <th className="px-4 py-3">Credits</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[.04] dark:divide-white/[.06] bg-white dark:bg-zinc-950">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    MODULE_BADGE[job.moduleName] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {MODULE_LABEL[job.moduleName] ?? job.moduleName}
                </span>
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
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-[200px] truncate">
                {job.inputPayload || <span className="text-zinc-300 dark:text-zinc-700 italic">없음</span>}
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                {job.creditUsed}
              </td>
              <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500 text-xs">
                {formatDate(job.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
