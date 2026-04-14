import Link from "next/link";
import type { Job } from "@/lib/api";

// ─── 상태 표시 설정 ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  PENDING:   { dot: "bg-zinc-400",  badge: "bg-zinc-800 text-zinc-400",                label: "대기 중"  },
  RUNNING:   { dot: "bg-blue-400 animate-pulse", badge: "bg-blue-900/40 text-blue-400", label: "생성 중" },
  COMPLETED: { dot: "bg-green-500", badge: "bg-green-900/40 text-green-400",            label: "완료"    },
  FAILED:    { dot: "bg-red-500",   badge: "bg-red-900/40 text-red-400",                label: "실패"    },
  CANCELLED: { dot: "bg-zinc-500",  badge: "bg-zinc-800 text-zinc-500",                label: "취소됨"  },
};

const MODULE_CONFIG: Record<string, { badge: string; label: string; accent: string }> = {
  IMAGE_GENERATION: { badge: "bg-purple-900/40 text-purple-300", label: "Image", accent: "border-t-purple-500" },
  TEXT_GENERATION:  { badge: "bg-emerald-900/40 text-emerald-300", label: "Text",  accent: "border-t-emerald-500" },
  SUMMARIZATION:    { badge: "bg-orange-900/40 text-orange-300", label: "Summary", accent: "border-t-orange-500" },
  TRANSLATION:      { badge: "bg-sky-900/40 text-sky-300",        label: "Translate", accent: "border-t-sky-500" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

// ─── 콘텐츠 미리보기 영역 ───────────────────────────────────────────────────────

function ContentPreview({ job }: { job: Job }) {
  const isImage = job.moduleName === "IMAGE_GENERATION";

  if (job.status === "COMPLETED" && job.outputPayload) {
    if (isImage) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={job.outputPayload}
          alt="생성된 이미지"
          className="w-full h-40 object-cover rounded-lg bg-zinc-900"
          loading="lazy"
        />
      );
    }
    return (
      <div className="rounded-lg bg-[#131316] border border-white/[.05] px-3 py-2.5 h-[6.5rem] overflow-hidden">
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4">
          {job.outputPayload}
        </p>
      </div>
    );
  }

  if (job.status === "FAILED") {
    return (
      <div className="rounded-lg border border-red-900/30 bg-red-950/20 h-[6.5rem] flex items-center justify-center">
        <p className="text-xs text-red-500">
          {job.errorMessage
            ? job.errorMessage.length > 60
              ? job.errorMessage.slice(0, 60) + "…"
              : job.errorMessage
            : "생성에 실패했습니다"}
        </p>
      </div>
    );
  }

  // PENDING / RUNNING
  return (
    <div className="rounded-lg border border-white/[.05] bg-[#131316] h-[6.5rem] flex items-center justify-center gap-2">
      {job.status === "RUNNING" && (
        <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
      )}
      <p className="text-xs text-zinc-600">
        {job.status === "RUNNING" ? "생성 중…" : "대기 중…"}
      </p>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────────────────────

export default function JobCard({ job }: { job: Job }) {
  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING;
  const moduleCfg = MODULE_CONFIG[job.moduleName] ?? {
    badge: "bg-zinc-800 text-zinc-400",
    label: job.moduleName,
    accent: "border-t-zinc-600",
  };

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`block rounded-xl border border-white/[.08] border-t-2 ${moduleCfg.accent} bg-[#1b1b1e] p-4 space-y-3 hover:bg-[#1e1e22] hover:border-white/[.12] transition-all cursor-pointer`}
    >
      {/* 상단: 모듈 배지 + 상태 배지 */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${moduleCfg.badge}`}>
          {moduleCfg.label}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* 콘텐츠 미리보기 */}
      <ContentPreview job={job} />

      {/* 프롬프트 */}
      {job.inputPayload && (
        <p className="text-xs text-zinc-600 truncate leading-relaxed">
          &ldquo;{job.inputPayload}&rdquo;
        </p>
      )}

      {/* 하단: 크레딧 + 시간 */}
      <div className="flex items-center justify-between text-xs text-zinc-600 pt-0.5">
        <span className="tabular-nums">{job.creditUsed} cr</span>
        <span className="tabular-nums">{formatDate(job.createdAt)}</span>
      </div>
    </Link>
  );
}
