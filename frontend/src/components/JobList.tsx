import Link from "next/link";
import type { Job } from "@/lib/api";

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  PENDING:   { dot: "bg-zinc-400",  badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",             label: "PENDING"   },
  RUNNING:   { dot: "bg-blue-500",  badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",          label: "RUNNING"   },
  COMPLETED: { dot: "bg-green-500", badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",      label: "COMPLETED" },
  FAILED:    { dot: "bg-red-500",   badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",              label: "FAILED"    },
  CANCELLED: { dot: "bg-zinc-400",  badge: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",             label: "CANCELLED" },
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
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function JobList({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-6 py-14 text-center">
        <p className="text-sm font-medium text-zinc-400">
          아직 실행된 Job이 없습니다.
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          위 모듈에서 프롬프트를 입력하고 Generate를 눌러보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[.08]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[.08] bg-[#1b1b1e] text-left text-xs font-medium text-zinc-500">
            <th className="px-4 py-3">Module</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Prompt</th>
            <th className="px-4 py-3 text-right">Credits</th>
            <th className="px-4 py-3 text-right">Created</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[.05] bg-[#131316]">
          {jobs.map((job) => {
            const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING;
            return (
              <tr key={job.id} className="hover:bg-white/[.03] transition-colors">
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      MODULE_BADGE[job.moduleName] ?? "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {MODULE_LABEL[job.moduleName] ?? job.moduleName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400 max-w-[200px] truncate">
                  {job.inputPayload || (
                    <span className="text-zinc-700 italic">없음</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-zinc-400">
                  {job.creditUsed}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-xs text-zinc-500 whitespace-nowrap">
                  {formatDate(job.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
