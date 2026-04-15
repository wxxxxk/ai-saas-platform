import Link from "next/link";
import type { Job } from "@/lib/api";
import CopyButton from "./CopyButton";
import DownloadButton from "./DownloadButton";
import RegenerateButton from "./RegenerateButton";

// ─── 상태 / 모듈 설정 ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  PENDING:   { dot: "bg-zinc-500",                      badge: "bg-zinc-800 text-zinc-400",        label: "대기 중"  },
  RUNNING:   { dot: "bg-blue-400 animate-pulse",        badge: "bg-blue-900/40 text-blue-400",     label: "생성 중"  },
  COMPLETED: { dot: "bg-green-500",                     badge: "bg-green-900/40 text-green-400",   label: "완료"     },
  FAILED:    { dot: "bg-red-500",                       badge: "bg-red-900/40 text-red-400",       label: "실패"     },
  CANCELLED: { dot: "bg-zinc-600",                      badge: "bg-zinc-800 text-zinc-500",        label: "취소됨"   },
};

const MODULE_CONFIG: Record<string, { badge: string; label: string; accent: string }> = {
  IMAGE_GENERATION: { badge: "bg-purple-900/40 text-purple-300",  label: "Image",    accent: "border-t-purple-500"  },
  TEXT_GENERATION:  { badge: "bg-emerald-900/40 text-emerald-300", label: "Text",    accent: "border-t-emerald-500" },
  SUMMARIZATION:    { badge: "bg-orange-900/40 text-orange-300",  label: "Summary",  accent: "border-t-orange-500"  },
  TRANSLATION:      { badge: "bg-sky-900/40 text-sky-300",        label: "Translate", accent: "border-t-sky-500"    },
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

// ─── 콘텐츠 미리보기 ───────────────────────────────────────────────────────────

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
      <div className="rounded-lg border border-red-900/30 bg-red-950/20 h-[6.5rem] flex items-center justify-center px-3">
        <p className="text-xs text-red-400 text-center leading-relaxed">
          {job.errorMessage
            ? job.errorMessage.length > 80
              ? job.errorMessage.slice(0, 80) + "…"
              : job.errorMessage
            : "생성에 실패했습니다"}
        </p>
      </div>
    );
  }

  // PENDING / RUNNING — animated loader
  const isRunning = job.status === "RUNNING";
  return (
    <div className="rounded-lg border border-white/[.05] bg-[#131316] h-[6.5rem] flex flex-col items-center justify-center gap-2.5">
      <span
        className={`h-5 w-5 rounded-full border-2 shrink-0 animate-spin ${
          isRunning
            ? "border-blue-900 border-t-blue-400"
            : "border-zinc-800 border-t-zinc-500"
        }`}
      />
      <p className={`text-xs ${isRunning ? "text-blue-400" : "text-zinc-600"}`}>
        {isRunning ? "생성 중…" : "대기 중…"}
      </p>
    </div>
  );
}

// ─── 카드 액션 바 ──────────────────────────────────────────────────────────────
// Link 외부에 위치해 <a> 중첩 문제를 방지한다.

function CardActions({ job }: { job: Job }) {
  const isImage    = job.moduleName === "IMAGE_GENERATION";
  const isComplete = job.status === "COMPLETED";
  const isFailed   = job.status === "FAILED";
  const hasOutput  = !!job.outputPayload;
  const hasPrompt  = !!job.inputPayload;

  // 액션 없는 상태 (PENDING / RUNNING / CANCELLED)
  if (!isComplete && !isFailed) return null;
  if (isComplete && !hasOutput && !hasPrompt) return null;
  if (isFailed && !hasPrompt) return null;

  return (
    <div className="px-4 pb-4">
      <div className="border-t border-white/[.06] pt-3 flex items-center gap-1.5 flex-wrap">
        {isComplete && hasOutput && !isImage && (
          <CopyButton text={job.outputPayload!} />
        )}
        {isComplete && hasOutput && isImage && (
          <DownloadButton url={job.outputPayload!} compact />
        )}
        {hasPrompt && (
          <RegenerateButton
            moduleId={job.moduleId}
            prompt={job.inputPayload!}
            creditCost={job.creditUsed}
          />
        )}
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────────────────────
//
// 구조:
//   div.card-wrapper          ← 보더/배경/hover 담당
//     Link.card-body          ← 클릭 시 /jobs/[id]로 이동
//       badges, preview, prompt, meta
//     div.action-bar          ← <a> 중첩 없이 별도 분리
//       CopyButton / DownloadButton / RegenerateButton

export default function JobCard({ job }: { job: Job }) {
  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING;
  const moduleCfg = MODULE_CONFIG[job.moduleName] ?? {
    badge:  "bg-zinc-800 text-zinc-400",
    label:  job.moduleName,
    accent: "border-t-zinc-600",
  };

  return (
    <div
      className={`
        flex flex-col rounded-xl border border-white/[.08] border-t-2 ${moduleCfg.accent}
        bg-[#1b1b1e] overflow-hidden
        hover:border-white/[.14] hover:bg-[#1e1e22]
        transition-all duration-150
      `}
    >
      {/* 카드 바디 — 전체가 상세 페이지 링크 */}
      <Link
        href={`/jobs/${job.id}`}
        className="block p-4 space-y-3 flex-1 hover:bg-white/[.015] transition-colors"
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

      {/* 액션 바 — Link 바깥에 위치 (HTML 중첩 문제 방지) */}
      <CardActions job={job} />
    </div>
  );
}
