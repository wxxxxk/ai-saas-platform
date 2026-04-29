"use client";

/**
 * JobLiveView — job detail 페이지의 동적 콘텐츠 전체를 담당하는 클라이언트 컴포넌트.
 *
 * 역할:
 *  1. SSR에서 받은 initialJob을 useState로 보관
 *  2. status가 PENDING / RUNNING이면 3초마다 /api/jobs/[id]를 polling
 *  3. 상태가 COMPLETED / FAILED로 바뀌면 polling 중단
 *  4. COMPLETED 전환 시 2초간 성공 하이라이트 표시
 *  5. 헤더·결과·사이드바를 최신 job 데이터로 렌더
 */

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Job } from "@/lib/api";
import { useFavorites, buildGroupKey } from "@/lib/useFavorites";
import { createJob } from "@/lib/actions";
import CopyButton from "./CopyButton";
import ImagePreview from "./ImagePreview";
import DownloadButton from "./DownloadButton";
import EditPromptForm from "./EditPromptForm";
import RelatedResults from "./RelatedResults";

// ─── Polling 설정 ──────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS  = 3_000;
const ACTIVE_STATUSES   = new Set(["PENDING", "RUNNING"]);
const HIGHLIGHT_MS      = 2_000;

// ─── 스타일 설정 ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  PENDING:   { dot: "bg-zinc-500",               badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",        label: "대기 중" },
  RUNNING:   { dot: "bg-blue-400 animate-pulse", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",     label: "생성 중" },
  COMPLETED: { dot: "bg-green-500",              badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400", label: "완료"    },
  FAILED:    { dot: "bg-red-500",                badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",         label: "실패"    },
  CANCELLED: { dot: "bg-zinc-600",               badge: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",        label: "취소됨"  },
};

const MODULE_STYLE: Record<string, { badge: string; label: string }> = {
  IMAGE_GENERATION: { badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",   label: "Image Generation" },
  TEXT_GENERATION:  { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", label: "Text Generation"  },
  SUMMARIZATION:    { badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",   label: "Summarization"    },
  TRANSLATION:      { badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",               label: "Translation"      },
};

const PROVIDER_LABEL: Record<string, string> = {
  OPENAI:       "OpenAI",
  GEMINI:       "Gemini",
  CLAUDE:       "Claude",
  STABILITY_AI: "Stability AI",
};

// ─── 생성 단계 메시지 ────────────────────────────────────────────────────────────

const GENERATION_STEPS: Record<string, string[]> = {
  IMAGE_GENERATION: [
    "프롬프트 분석 중",
    "스타일 방향 설정 중",
    "OpenAI에 생성 요청 중",
    "이미지 처리 중",
  ],
  TEXT_GENERATION: [
    "프롬프트 분석 중",
    "문장 구조 설계 중",
    "OpenAI에 생성 요청 중",
    "결과 정리 중",
  ],
};

const STEP_INTERVAL_MS = 2_500;

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    hour12: false, timeZone: "Asia/Seoul",
  });
}

// ─── LIVE 인디케이터 ───────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/50 border border-blue-900/40 px-2 py-0.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
      </span>
      <span className="text-[10px] font-semibold text-blue-400 tracking-wide">LIVE</span>
    </div>
  );
}

// ─── 섹션 라벨 ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
      {children}
    </p>
  );
}

// ─── 사이드바 섹션 래퍼 ───────────────────────────────────────────────────────

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-low p-5">
      <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── 진행 중 표시 ─────────────────────────────────────────────────────────────

function InProgressSection({
  status,
  isPolling,
  moduleName,
}: {
  status: string;
  isPolling: boolean;
  moduleName?: string;
}) {
  const isRunning = status === "RUNNING";
  const steps =
    (moduleName && GENERATION_STEPS[moduleName]) ??
    ["요청 처리 중", "AI 분석 중", "결과 생성 중", "마무리 중"];

  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(
      () => setStepIdx((i) => (i + 1) % steps.length),
      STEP_INTERVAL_MS
    );
    return () => clearInterval(id);
  }, [isRunning, steps.length]);

  return (
    <div
      className={`rounded-xl border p-8 flex flex-col items-center gap-5 text-center transition-colors duration-500 ${
        isRunning
          ? "border-blue-900/40 bg-blue-950/20"
          : "border-border bg-surface-low"
      }`}
    >
      <div className="relative">
        <span
          className={`h-12 w-12 rounded-full border-[3px] animate-spin block ${
            isRunning
              ? "border-blue-900 border-t-blue-400"
              : "border-zinc-300 dark:border-zinc-800 border-t-zinc-500"
          }`}
        />
        {isRunning && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-blue-400/50 animate-pulse" />
          </span>
        )}
      </div>

      <div className="space-y-2">
        <p
          className={`text-sm font-semibold ${
            isRunning ? "text-blue-300" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {isRunning ? "AI가 콘텐츠를 생성하고 있습니다" : "처리 대기 중입니다"}
        </p>

        {isRunning && (
          <p className="text-xs font-medium text-blue-400/60">
            ↻ {steps[stepIdx]}…
          </p>
        )}

        <p className="text-xs text-zinc-600 leading-relaxed max-w-xs">
          {isRunning
            ? "완료되면 결과가 이 페이지에 자동으로 표시됩니다."
            : "요청이 접수되었습니다. 처리가 곧 시작됩니다."}
        </p>
      </div>

      {isPolling && (
        <div className="flex items-center gap-2 text-xs text-blue-400/70">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
          </span>
          3초마다 자동으로 상태를 확인하고 있습니다
        </div>
      )}
    </div>
  );
}

// ─── 실패 표시 ────────────────────────────────────────────────────────────────

function FailedSection({ errorMessage }: { errorMessage: string | null }) {
  return (
    <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 space-y-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
        <p className="text-sm font-semibold text-red-400">생성에 실패했습니다</p>
      </div>
      {errorMessage ? (
        <p className="text-xs text-red-400/80 leading-relaxed pl-4 border-l border-red-900/50">
          {errorMessage}
        </p>
      ) : (
        <p className="text-xs text-red-500/60 pl-4">알 수 없는 오류가 발생했습니다.</p>
      )}
      <p className="text-xs text-zinc-600 pt-1">
        오른쪽에서 프롬프트를 수정하거나 동일한 내용으로 다시 시도해 보세요.
      </p>
    </div>
  );
}

// ─── 텍스트 결과 표시 ─────────────────────────────────────────────────────────

function TextResultSection({
  text,
  highlight,
}: {
  text: string;
  highlight: boolean;
}) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  return (
    <div
      className={`rounded-xl border p-5 space-y-3 transition-all duration-700 ${
        highlight
          ? "border-green-800/40 bg-green-950/10"
          : "border-border bg-surface-low"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs tabular-nums text-zinc-500">
          <span>{wordCount.toLocaleString()} 단어</span>
          <span className="text-zinc-400 dark:text-zinc-800">·</span>
          <span>{charCount.toLocaleString()} 자</span>
        </div>
        <CopyButton
          text={text}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-high dark:bg-zinc-800/50 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-surface-highest dark:hover:bg-zinc-700/50 transition-colors"
        />
      </div>

      <div className="rounded-lg bg-surface border border-border-faint p-5">
        <p className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-7">{text}</p>
      </div>
    </div>
  );
}

// ─── 사이드바: 상태 ───────────────────────────────────────────────────────────

function SidebarStatus({ job, isPolling }: { job: Job; isPolling: boolean }) {
  const cfg = STATUS_STYLE[job.status] ?? STATUS_STYLE.PENDING;
  const isActive = job.status === "RUNNING" || job.status === "PENDING";
  const isRunning = job.status === "RUNNING";

  if (isActive) {
    return (
      <SidebarSection title="상태">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 animate-spin ${
              isRunning
                ? "border-blue-900 border-t-blue-400"
                : "border-zinc-300 dark:border-zinc-800 border-t-zinc-500"
            }`}
          />
          <div className="space-y-1">
            <p className={`text-sm font-semibold ${isRunning ? "text-blue-400" : "text-zinc-600 dark:text-zinc-300"}`}>
              {cfg.label}
            </p>
            <p className="text-xs text-zinc-600">
              {isRunning ? "처리 중입니다" : "처리 대기 중입니다"}
            </p>
            {isPolling && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
                </span>
                <span className="text-[10px] text-zinc-600">자동 업데이트 중</span>
              </div>
            )}
          </div>
        </div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="상태">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{cfg.label}</span>
      </div>
    </SidebarSection>
  );
}

// ─── 사이드바: 결과 저장 ──────────────────────────────────────────────────────

function SidebarActions({ job, isImage }: { job: Job; isImage: boolean }) {
  if (job.status !== "COMPLETED" || !job.outputPayload) return null;
  return (
    <SidebarSection title={isImage ? "이미지 저장" : "텍스트 복사"}>
      {isImage ? (
        <DownloadButton url={job.outputPayload} />
      ) : (
        <CopyButton
          text={job.outputPayload}
          className="w-full rounded-lg border border-border bg-surface-high dark:bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-surface-highest dark:hover:bg-zinc-700/60 transition-colors text-center"
        />
      )}
    </SidebarSection>
  );
}

// ─── 사이드바: 계속 작업하기 ──────────────────────────────────────────────────

function SidebarContinue({
  job,
  label,
  relatedCount = 0,
}: {
  job: Job;
  label: string;
  relatedCount?: number;
}) {
  if (!job.inputPayload) return null;
  return (
    <SidebarSection title={label}>
      <EditPromptForm
        moduleId={job.moduleId}
        initialPrompt={job.inputPayload}
        creditCost={job.creditUsed}
        defaultProvider={job.provider}
      />
      {relatedCount > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600 border-t border-border-faint pt-3">
          이 프롬프트로 만든 결과가{" "}
          <span className="font-semibold text-zinc-500">{relatedCount}개</span> 더 있습니다.{" "}
          <span className="text-zinc-600">페이지 아래에서 비교해 보세요 ↓</span>
        </p>
      )}
    </SidebarSection>
  );
}

// ─── 사이드바: 결과 선택 (즐겨찾기) ──────────────────────────────────────────

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function SidebarFavorite({
  isSelected,
  onToggle,
}: {
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <SidebarSection title="결과 선택">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          isSelected
            ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/15"
            : "border border-border text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-black/[.18] dark:hover:border-white/[.18]"
        }`}
      >
        <StarIcon filled={isSelected} className="h-4 w-4" />
        {isSelected ? "선택된 버전" : "이 결과 선택하기"}
      </button>

      {isSelected && (
        <div className="mt-2.5 space-y-1.5 text-center">
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            이 프롬프트의 대표 결과입니다.
          </p>
          <button
            type="button"
            onClick={onToggle}
            className="text-[11px] text-zinc-600 hover:text-zinc-400 underline underline-offset-2 transition-colors"
          >
            선택 해제
          </button>
        </div>
      )}
    </SidebarSection>
  );
}

// ─── 사이드바: 상세 정보 ──────────────────────────────────────────────────────

function SidebarDetails({ job }: { job: Job }) {
  return (
    <SidebarSection title="상세 정보">
      <dl className="space-y-3">
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">공급자</dt>
          <dd className="text-xs text-zinc-500">{PROVIDER_LABEL[job.provider] ?? job.provider}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">생성 시각</dt>
          <dd className="text-xs text-zinc-500 tabular-nums">{formatDate(job.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">소모 크레딧</dt>
          <dd className="text-xs text-zinc-500 tabular-nums">{job.creditUsed} cr</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">Job ID</dt>
          <dd>
            <code className="text-xs text-zinc-600 break-all leading-relaxed">
              {job.id}
            </code>
          </dd>
        </div>
      </dl>
    </SidebarSection>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

interface Props {
  initialJob: Job;
  relatedJobs: Job[];
}

export default function JobLiveView({ initialJob, relatedJobs }: Props) {

  // ─── State ──────────────────────────────────────────────────────────────────

  const [job, setJob]               = useState<Job>(initialJob);
  const [isPolling, setIsPolling]   = useState(() => ACTIVE_STATUSES.has(initialJob.status));
  const [justCompleted, setJustCompleted] = useState(false);
  const [isRegenerating, startRegenerate] = useTransition();

  function handleQuickRegenerate() {
    if (!job.inputPayload) return;
    startRegenerate(async () => {
      try {
        const jobId = await createJob(job.moduleId, job.inputPayload!, job.provider);
        window.location.assign(`/jobs/${jobId}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "재생성에 실패했습니다.");
      }
    });
  }

  // ─── Favorites ──────────────────────────────────────────────────────────────

  const { isFavorite, toggleFavorite } = useFavorites();
  const groupKey = buildGroupKey(job.moduleName, job.inputPayload);

  // ─── Polling lifecycle ───────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ACTIVE_STATUSES.has(initialJob.status)) return;

    let stopped = false;

    async function poll() {
      if (stopped) return;

      try {
        const res = await fetch(`/api/jobs/${initialJob.id}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (stopped) return;

        if (res.status === 401) {
          stopped = true;
          setIsPolling(false);
          toast.error("로그인이 만료되었습니다. 다시 로그인해 주세요.");
          return;
        }

        if (!res.ok) return;

        const updated: Job = await res.json();

        setJob((prev) => {
          if (prev.status !== updated.status) {
            console.log(`[JobLiveView] ${prev.status} → ${updated.status} (jobId=${initialJob.id})`);
          }
          if (
            prev.status        === updated.status &&
            prev.outputPayload === updated.outputPayload &&
            prev.errorMessage  === updated.errorMessage
          ) {
            return prev;
          }
          return updated;
        });

        if (!ACTIVE_STATUSES.has(updated.status)) {
          stopped = true;
          setIsPolling(false);
          console.log(`[JobLiveView] polling stopped: status=${updated.status} jobId=${initialJob.id}`);

          if (updated.status === "COMPLETED") {
            setJustCompleted(true);
            setTimeout(() => setJustCompleted(false), HIGHLIGHT_MS);
          }
        }
      } catch {
        // 네트워크 오류 — 재시도 허용
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, []); // ← 의도적인 빈 배열

  // ─── 파생 상태 ──────────────────────────────────────────────────────────────

  const isImage      = job.moduleName === "IMAGE_GENERATION";
  const isCompleted  = job.status === "COMPLETED";
  const isFailed     = job.status === "FAILED";
  const isInProgress = job.status === "PENDING" || job.status === "RUNNING";
  const hasOutput    = isCompleted && !!job.outputPayload;
  const hasPrompt    = !!job.inputPayload;

  const statusCfg = STATUS_STYLE[job.status]     ?? STATUS_STYLE.PENDING;
  const moduleCfg = MODULE_STYLE[job.moduleName] ?? {
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    label: job.moduleName,
  };

  const pageTitle = isInProgress
    ? "생성 중…"
    : isFailed
      ? "생성 실패"
      : isImage
        ? "이미지 결과"
        : "텍스트 결과";

  // ─── 렌더 ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-7">

      {/* ── 페이지 헤더 ── */}
      <header className="space-y-2">
        <div className="flex items-center flex-wrap gap-2">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${moduleCfg.badge}`}
          >
            {moduleCfg.label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          {isPolling && <LiveBadge />}
          <span className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-zinc-500">
            {PROVIDER_LABEL[job.provider] ?? job.provider}
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 font-headline leading-tight">
          {pageTitle}
        </h1>

        <time className="block text-xs text-zinc-600 tabular-nums">
          {formatDate(job.createdAt)}
        </time>
      </header>

      {/* ── 2단 워크스페이스 ── */}
      <div className="grid lg:grid-cols-[1fr_288px] gap-6 items-start">

        {/* 메인 콘텐츠 */}
        <div className="space-y-5 min-w-0">

          {/* 프롬프트 */}
          {hasPrompt && (
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Your Prompt
                </p>
                {isCompleted && (
                  <a
                    href="#continue"
                    className="text-[10px] text-zinc-600 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
                  >
                    프롬프트 수정 ↓
                  </a>
                )}
              </div>
              <div className="rounded-xl border border-border bg-surface-low px-5 py-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {job.inputPayload}
                </p>
              </div>
            </section>
          )}

          {/* 결과 */}
          <section>
            <SectionLabel>
              {isInProgress
                ? "Processing"
                : isFailed
                  ? "Error"
                  : isImage
                    ? "Generated Image"
                    : "Generated Text"}
            </SectionLabel>

            {isInProgress && (
              <InProgressSection
                status={job.status}
                isPolling={isPolling}
                moduleName={job.moduleName}
              />
            )}

            {isFailed && (
              <FailedSection errorMessage={job.errorMessage} />
            )}

            {hasOutput && !isImage && (
              <>
                <TextResultSection text={job.outputPayload!} highlight={justCompleted} />

                {job.inputPayload && (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleQuickRegenerate}
                      disabled={isRegenerating}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-black/[.04] dark:hover:bg-white/[.04] hover:border-black/[.18] dark:hover:border-white/[.18] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isRegenerating ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white shrink-0" />
                          생성 중…
                        </>
                      ) : (
                        <>
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          새 버전 만들기
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-zinc-600 tabular-nums">
                      −{job.creditUsed} cr
                    </span>
                  </div>
                )}
              </>
            )}

            {hasOutput && isImage && (
              <div
                className={`rounded-xl border p-5 transition-all duration-700 ${
                  justCompleted
                    ? "border-green-700/50 bg-green-950/15 shadow-[0_0_40px_rgba(34,197,94,0.07)]"
                    : "border-border bg-surface-low"
                }`}
              >
                <div className="overflow-hidden rounded-lg">
                  <div className="transition-transform duration-500 ease-out hover:scale-[1.03] origin-center">
                    <ImagePreview src={job.outputPayload!} />
                  </div>
                </div>
              </div>
            )}

            {isCompleted && !job.outputPayload && (
              <div className="rounded-xl border border-border bg-surface-low px-5 py-8 text-center">
                <p className="text-sm text-zinc-500">결과 데이터가 없습니다.</p>
              </div>
            )}
          </section>
        </div>

        {/* 사이드바 */}
        <aside className="space-y-4 lg:sticky lg:top-8">

          <SidebarStatus job={job} isPolling={isPolling} />
          <SidebarActions job={job} isImage={isImage} />

          {isCompleted && hasOutput && groupKey && (
            <SidebarFavorite
              isSelected={isFavorite(groupKey, job.id)}
              onToggle={() => toggleFavorite(groupKey, job.id)}
            />
          )}

          {(isCompleted || isFailed) && hasPrompt && (
            <span id="continue" className="sr-only" aria-hidden />
          )}

          {isCompleted && hasPrompt && (
            <SidebarContinue
              job={job}
              label="계속 작업하기"
              relatedCount={relatedJobs.length}
            />
          )}
          {isFailed && hasPrompt && (
            <SidebarContinue
              job={job}
              label="다시 시도"
              relatedCount={relatedJobs.length}
            />
          )}

          <SidebarDetails job={job} />

          <Link
            href="/jobs"
            prefetch={false}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border-faint bg-transparent px-4 py-3 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/[.04] dark:hover:bg-white/[.04] transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8" />
            </svg>
            전체 히스토리 보기
          </Link>

        </aside>
      </div>

      {/* ── 관련 결과 비교 ── */}
      {relatedJobs.length > 0 && (
        <RelatedResults
          currentJob={job}
          relatedJobs={relatedJobs}
          favoritesApi={{ isFavorite, toggleFavorite }}
        />
      )}

      {/* ── 생성 완료 배너 ── */}
      {justCompleted && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="flex items-center gap-2.5 rounded-full border border-green-700/50 bg-green-950/90 px-5 py-2.5 text-sm font-semibold text-green-300 shadow-2xl backdrop-blur-sm">
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            생성이 완료되었습니다
          </div>
        </div>
      )}

    </div>
  );
}
