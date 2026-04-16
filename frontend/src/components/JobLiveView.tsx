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
const HIGHLIGHT_MS      = 2_000; // COMPLETED 전환 후 하이라이트 지속 시간

// ─── 스타일 설정 ────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { dot: string; badge: string; label: string }> = {
  PENDING:   { dot: "bg-zinc-500",               badge: "bg-zinc-800 text-zinc-400",        label: "대기 중" },
  RUNNING:   { dot: "bg-blue-400 animate-pulse", badge: "bg-blue-900/40 text-blue-400",     label: "생성 중" },
  COMPLETED: { dot: "bg-green-500",              badge: "bg-green-900/40 text-green-400",   label: "완료"    },
  FAILED:    { dot: "bg-red-500",                badge: "bg-red-900/40 text-red-400",       label: "실패"    },
  CANCELLED: { dot: "bg-zinc-600",               badge: "bg-zinc-800 text-zinc-500",        label: "취소됨"  },
};

const MODULE_STYLE: Record<string, { badge: string; label: string }> = {
  IMAGE_GENERATION: { badge: "bg-purple-900/40 text-purple-300",  label: "Image Generation" },
  TEXT_GENERATION:  { badge: "bg-emerald-900/40 text-emerald-300", label: "Text Generation"  },
  SUMMARIZATION:    { badge: "bg-orange-900/40 text-orange-300",  label: "Summarization"    },
  TRANSLATION:      { badge: "bg-sky-900/40 text-sky-300",        label: "Translation"      },
};

const PROVIDER_LABEL: Record<string, string> = {
  OPENAI:       "OpenAI",
  GEMINI:       "Gemini",
  CLAUDE:       "Claude",
  STABILITY_AI: "Stability AI",
};

// ─── 헬퍼 ──────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
    hour12: false, timeZone: "Asia/Seoul",
  });
}

// ─── LIVE 인디케이터 ───────────────────────────────────────────────────────────
// Ping 애니메이션으로 실시간 업데이트 중임을 시각화한다.

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
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5">
      <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── 진행 중 표시 ─────────────────────────────────────────────────────────────
// "새로고침" 링크 대신 자동 업데이트 안내 메시지를 표시한다.

function InProgressSection({
  status,
  isPolling,
}: {
  status: string;
  isPolling: boolean;
}) {
  const isRunning = status === "RUNNING";
  return (
    <div
      className={`rounded-xl border p-8 flex flex-col items-center gap-5 text-center transition-colors duration-500 ${
        isRunning
          ? "border-blue-900/40 bg-blue-950/20"
          : "border-white/[.08] bg-[#1b1b1e]"
      }`}
    >
      <span
        className={`h-10 w-10 rounded-full border-[3px] animate-spin ${
          isRunning
            ? "border-blue-900 border-t-blue-400"
            : "border-zinc-800 border-t-zinc-500"
        }`}
      />
      <div className="space-y-1.5">
        <p
          className={`text-sm font-semibold ${
            isRunning ? "text-blue-300" : "text-zinc-300"
          }`}
        >
          {isRunning ? "AI가 콘텐츠를 생성하고 있습니다" : "처리 대기 중입니다"}
        </p>
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
// `highlight` prop으로 COMPLETED 전환 직후 그린 하이라이트를 적용한다.

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
          : "border-white/[.08] bg-[#1b1b1e]"
      }`}
    >
      {/* 액션 헤더 — 통계와 복사 버튼을 결과 텍스트 위에 배치해 즉시 접근 가능하게 한다 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs tabular-nums text-zinc-700">
          <span>{wordCount.toLocaleString()} 단어</span>
          <span className="text-zinc-800">·</span>
          <span>{charCount.toLocaleString()} 자</span>
        </div>
        <CopyButton
          text={text}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[.08] bg-zinc-800/50 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 transition-colors"
        />
      </div>

      {/* 텍스트 콘텐츠 */}
      <div className="rounded-lg bg-[#131316] border border-white/[.05] p-5">
        <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-7">{text}</p>
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
                : "border-zinc-800 border-t-zinc-500"
            }`}
          />
          <div className="space-y-1">
            <p className={`text-sm font-semibold ${isRunning ? "text-blue-400" : "text-zinc-300"}`}>
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
        <span className="text-sm font-semibold text-zinc-300">{cfg.label}</span>
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
          className="w-full rounded-lg border border-white/[.1] bg-zinc-800/50 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-700/60 transition-colors text-center"
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
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600 border-t border-white/[.05] pt-3">
          이 프롬프트로 만든 결과가{" "}
          <span className="font-semibold text-zinc-500">{relatedCount}개</span> 더 있습니다.{" "}
          <span className="text-zinc-600">페이지 아래에서 비교해 보세요 ↓</span>
        </p>
      )}
    </SidebarSection>
  );
}

// ─── 사이드바: 결과 선택 (즐겨찾기) ──────────────────────────────────────────
//
// localStorage-backed. Amber star = "chosen version" for this prompt family.
// Renders only when the job is COMPLETED with output AND has a prompt (groupKey exists).

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
            : "border border-white/[.1] text-zinc-400 hover:text-zinc-200 hover:border-white/[.18]"
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
          <dd className="text-xs text-zinc-400">{PROVIDER_LABEL[job.provider] ?? job.provider}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">생성 시각</dt>
          <dd className="text-xs text-zinc-400 tabular-nums">{formatDate(job.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-600 mb-0.5">소모 크레딧</dt>
          <dd className="text-xs text-zinc-400 tabular-nums">{job.creditUsed} cr</dd>
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

  // 같은 프롬프트 + 같은 공급자로 새 Job을 생성해 해당 결과 페이지로 이동한다.
  function handleQuickRegenerate() {
    if (!job.inputPayload) return;
    startRegenerate(async () => {
      const jobId = await createJob(job.moduleId, job.inputPayload!, job.provider);
      window.location.assign(`/jobs/${jobId}`);
    });
  }

  // ─── Favorites ──────────────────────────────────────────────────────────────

  const { isFavorite, toggleFavorite } = useFavorites();
  // groupKey is null when the job has no prompt (can't be grouped / selected)
  const groupKey = buildGroupKey(job.moduleName, job.inputPayload);

  // ─── Polling lifecycle ───────────────────────────────────────────────────────
  //
  // 설계 원칙:
  //  - 마운트 시 1회만 실행 (deps: [])
  //  - `stopped` 플래그로 언마운트 후 응답이 도착해도 setState 방지
  //  - 응답 데이터가 실제로 변경된 경우에만 setState → 불필요한 리렌더 방지
  //  - 네트워크 오류는 무시하고 계속 polling (일시적 장애 허용)
  //  - terminal 상태 도달 시 interval 즉시 해제

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ACTIVE_STATUSES.has(initialJob.status)) return; // 이미 완료 상태 — polling 불필요

    let stopped = false;

    async function poll() {
      if (stopped) return;

      try {
        const res = await fetch(`/api/jobs/${initialJob.id}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!res.ok || stopped) return;

        const updated: Job = await res.json();

        // 실제로 변경된 경우에만 setState (불필요한 리렌더 방지)
        setJob((prev) => {
          if (
            prev.status        === updated.status &&
            prev.outputPayload === updated.outputPayload &&
            prev.errorMessage  === updated.errorMessage
          ) {
            return prev; // 참조 동일 → React가 리렌더 건너뜀
          }
          return updated;
        });

        // Terminal 상태에 도달하면 polling 중단
        if (!ACTIVE_STATUSES.has(updated.status)) {
          stopped = true;
          setIsPolling(false);

          if (updated.status === "COMPLETED") {
            // COMPLETED 전환 시 결과 섹션에 잠깐 하이라이트 표시
            setJustCompleted(true);
            setTimeout(() => setJustCompleted(false), HIGHLIGHT_MS);
          }
        }
      } catch {
        // 네트워크 오류 — 재시도 허용, interval 유지
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      stopped = true;     // in-flight fetch가 완료되어도 setState 차단
      clearInterval(id);
    };
  }, []); // ← 의도적인 빈 배열: 마운트 시 1회 실행. initialJob.id는 클로저로 캡처 (변경 없음).

  // ─── 파생 상태 ──────────────────────────────────────────────────────────────

  const isImage      = job.moduleName === "IMAGE_GENERATION";
  const isCompleted  = job.status === "COMPLETED";
  const isFailed     = job.status === "FAILED";
  const isInProgress = job.status === "PENDING" || job.status === "RUNNING";
  const hasOutput    = isCompleted && !!job.outputPayload;
  const hasPrompt    = !!job.inputPayload;

  const statusCfg = STATUS_STYLE[job.status]     ?? STATUS_STYLE.PENDING;
  const moduleCfg = MODULE_STYLE[job.moduleName] ?? {
    badge: "bg-zinc-800 text-zinc-400",
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
        {/* 배지 행 — 폴링 LIVE 인디케이터 포함 */}
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
          <span className="inline-block rounded-full border border-white/[.08] px-2.5 py-0.5 text-xs font-medium text-zinc-500">
            {PROVIDER_LABEL[job.provider] ?? job.provider}
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-50 font-headline leading-tight">
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
              {/* 헤더: 섹션 라벨 + 완료 시 수정 바로가기 링크 */}
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  Your Prompt
                </p>
                {isCompleted && (
                  <a
                    href="#continue"
                    className="text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    프롬프트 수정 ↓
                  </a>
                )}
              </div>
              <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5 py-4">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
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
              <InProgressSection status={job.status} isPolling={isPolling} />
            )}

            {isFailed && (
              <FailedSection errorMessage={job.errorMessage} />
            )}

            {hasOutput && !isImage && (
              <>
                <TextResultSection text={job.outputPayload!} highlight={justCompleted} />

                {/* 빠른 재생성 — 사이드바 없이 한 번에 새 버전을 만든다 */}
                {job.inputPayload && (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleQuickRegenerate}
                      disabled={isRegenerating}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[.1] px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[.04] hover:border-white/[.18] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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
                    <span className="text-[10px] text-zinc-700 tabular-nums">
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
                    ? "border-green-800/40 bg-green-950/10"
                    : "border-white/[.08] bg-[#1b1b1e]"
                }`}
              >
                <ImagePreview src={job.outputPayload!} />
              </div>
            )}

            {isCompleted && !job.outputPayload && (
              <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5 py-8 text-center">
                <p className="text-sm text-zinc-500">결과 데이터가 없습니다.</p>
              </div>
            )}
          </section>
        </div>

        {/* 사이드바 */}
        <aside className="space-y-4 lg:sticky lg:top-8">

          <SidebarStatus job={job} isPolling={isPolling} />
          <SidebarActions job={job} isImage={isImage} />

          {/* Result selection — only for COMPLETED jobs with a prompt */}
          {isCompleted && hasOutput && groupKey && (
            <SidebarFavorite
              isSelected={isFavorite(groupKey, job.id)}
              onToggle={() => toggleFavorite(groupKey, job.id)}
            />
          )}

          {/* scroll anchor — "Your Prompt" 섹션의 "프롬프트 수정 ↓" 링크 대상 */}
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
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[.07] bg-transparent px-4 py-3 text-xs font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/[.04] transition-colors"
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

      {/* ── 관련 결과 비교 — polled job 상태 + favorites API 전달 ── */}
      {relatedJobs.length > 0 && (
        <RelatedResults
          currentJob={job}
          relatedJobs={relatedJobs}
          favoritesApi={{ isFavorite, toggleFavorite }}
        />
      )}

    </div>
  );
}
