"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/api";
import EditPromptForm from "./EditPromptForm";
import CopyButton from "./CopyButton";
import DownloadButton from "./DownloadButton";

// ─── Exported type ─────────────────────────────────────────────────────────────

export type VariationGroupData = {
  key: string;
  moduleName: string;
  moduleId: string;
  prompt: string | null;
  jobs: Job[];      // sorted newest-first
  latestJob: Job;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { dot: string; label: string; text: string }> = {
  PENDING:   { dot: "bg-zinc-500",               label: "대기 중", text: "text-zinc-500" },
  RUNNING:   { dot: "bg-blue-400 animate-pulse", label: "생성 중", text: "text-blue-400" },
  COMPLETED: { dot: "bg-green-500",              label: "완료",    text: "text-green-400" },
  FAILED:    { dot: "bg-red-500",                label: "실패",    text: "text-red-400"  },
  CANCELLED: { dot: "bg-zinc-600",               label: "취소됨",  text: "text-zinc-600" },
};

const MODULE_CFG: Record<string, { label: string; badge: string; topBorder: string }> = {
  IMAGE_GENERATION: { label: "Image",     badge: "bg-purple-900/40 text-purple-300",   topBorder: "border-t-purple-500/50"  },
  TEXT_GENERATION:  { label: "Text",      badge: "bg-emerald-900/40 text-emerald-300", topBorder: "border-t-emerald-500/50" },
  SUMMARIZATION:    { label: "Summary",   badge: "bg-orange-900/40 text-orange-300",   topBorder: "border-t-orange-500/50"  },
  TRANSLATION:      { label: "Translate", badge: "bg-sky-900/40 text-sky-300",         topBorder: "border-t-sky-500/50"     },
};

const COLLAPSED_COUNT = 2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1)  return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  if (hrs  < 24) return `${hrs}시간 전`;
  return `${days}일 전`;
}

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.PENDING;
  return <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />;
}

// ─── Compact variation row ────────────────────────────────────────────────────
//
// Structure:
//   div.row-wrapper              ← hover background, flex container
//     Link.clickable-area        ← left square + text preview + time meta
//     div.actions                ← Copy / Download buttons (outside Link, no <a> nesting)

function VariationRow({
  job,
  isNewest,
  showNewestBadge,
}: {
  job: Job;
  isNewest: boolean;
  showNewestBadge: boolean;
}) {
  const isImage    = job.moduleName === "IMAGE_GENERATION";
  const isComplete = job.status === "COMPLETED" && !!job.outputPayload;
  const isFailed   = job.status === "FAILED";
  const statusCfg  = STATUS_CFG[job.status] ?? STATUS_CFG.PENDING;

  const previewText = isComplete && !isImage
    ? job.outputPayload!.slice(0, 120)
    : isFailed
      ? (job.errorMessage?.slice(0, 80) ?? "생성 실패")
      : statusCfg.label;

  const previewColor = isComplete && !isImage
    ? "text-zinc-400"
    : isFailed
      ? "text-red-400/80"
      : statusCfg.text;

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg transition-colors hover:bg-white/[.025] ${
        isNewest ? "bg-white/[.016]" : ""
      }`}
    >
      {/* Left square: image thumbnail or status indicator */}
      <Link
        href={`/jobs/${job.id}`}
        prefetch={false}
        className="flex items-center gap-2.5 flex-1 min-w-0 group/row"
      >
        {isImage && isComplete ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.outputPayload!}
            alt=""
            className="h-9 w-9 rounded-md object-cover shrink-0 bg-zinc-900 border border-white/[.06]"
            loading="lazy"
          />
        ) : (
          <div
            className={`h-9 w-9 rounded-md shrink-0 border flex items-center justify-center ${
              isFailed
                ? "border-red-900/40 bg-red-950/20"
                : job.status === "RUNNING"
                  ? "border-blue-900/40 bg-blue-950/15"
                  : "border-white/[.06] bg-[#131316]"
            }`}
          >
            {job.status === "RUNNING" || job.status === "PENDING" ? (
              <span
                className={`h-3.5 w-3.5 rounded-full border-2 animate-spin ${
                  job.status === "RUNNING"
                    ? "border-blue-900 border-t-blue-400"
                    : "border-zinc-800 border-t-zinc-600"
                }`}
              />
            ) : (
              <StatusDot status={job.status} />
            )}
          </div>
        )}

        {/* Preview text */}
        <span
          className={`flex-1 min-w-0 text-xs truncate leading-relaxed transition-colors group-hover/row:text-zinc-200 ${previewColor}`}
        >
          {previewText}
        </span>

        {/* Right meta: newest badge + relative time + arrow */}
        <div className="flex items-center gap-2 shrink-0">
          {isNewest && showNewestBadge && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#9d4edd] bg-[#9d4edd]/10 border border-[#9d4edd]/25 rounded-full px-1.5 py-px leading-tight">
              최신
            </span>
          )}
          <span className="text-[11px] text-zinc-700 tabular-nums whitespace-nowrap">
            {relativeTime(job.createdAt)}
          </span>
          <span className="text-xs text-zinc-700 group-hover/row:text-zinc-400 transition-colors">
            →
          </span>
        </div>
      </Link>

      {/* Output actions — outside Link to avoid <a> nesting */}
      <div className="shrink-0 flex items-center">
        {isComplete && !isImage && <CopyButton text={job.outputPayload!} />}
        {isComplete && isImage    && <DownloadButton url={job.outputPayload!} compact />}
      </div>
    </div>
  );
}

// ─── Group header ─────────────────────────────────────────────────────────────

function GroupHeader({
  group,
  expanded,
  onToggle,
  showForm,
  onToggleForm,
}: {
  group: VariationGroupData;
  expanded: boolean;
  onToggle: () => void;
  showForm: boolean;
  onToggleForm: () => void;
}) {
  const moduleCfg = MODULE_CFG[group.moduleName] ?? {
    label: group.moduleName,
    badge: "bg-zinc-800 text-zinc-400",
    topBorder: "",
  };
  const statusCfg = STATUS_CFG[group.latestJob.status] ?? STATUS_CFG.PENDING;
  const count     = group.jobs.length;
  const canExpand = count > COLLAPSED_COUNT;

  return (
    <div className="px-4 pt-4 pb-3 space-y-3">

      {/* Row 1: module badge + prompt + expand toggle */}
      <div className="flex items-start gap-3">

        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${moduleCfg.badge}`}>
          {moduleCfg.label}
        </span>

        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug">
            {group.prompt ?? (
              <span className="italic text-zinc-600">프롬프트 없음</span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* Variation count badge (only when >1) */}
            {count > 1 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-800/60 border border-white/[.06] rounded-full px-2 py-0.5">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {count}개 변형
              </span>
            )}

            {/* Latest status */}
            <span className={`inline-flex items-center gap-1 text-[10px] ${statusCfg.text}`}>
              <StatusDot status={group.latestJob.status} />
              {statusCfg.label}
            </span>

            {/* Relative time */}
            <span className="text-[10px] text-zinc-600 tabular-nums">
              {relativeTime(group.latestJob.createdAt)}
            </span>
          </div>
        </div>

        {/* Expand / collapse toggle (only when collapsible) */}
        {canExpand && (
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 mt-0.5 inline-flex items-center gap-1 rounded-lg border border-white/[.07] px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 hover:border-white/[.15] transition-all"
          >
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? "접기" : `+${count - COLLAPSED_COUNT}`}
          </button>
        )}
      </div>

      {/* Row 2: "새 변형 만들기" toggle — only when group has a prompt */}
      {group.prompt && (
        <button
          type="button"
          onClick={onToggleForm}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            showForm
              ? "bg-[#9d4edd]/15 border-[#9d4edd]/40 text-[#e0b6ff]"
              : "border-white/[.08] text-zinc-500 hover:text-zinc-200 hover:border-white/[.15]"
          }`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          새 변형 만들기
        </button>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function VariationGroup({ group }: { group: VariationGroupData }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const moduleCfg   = MODULE_CFG[group.moduleName] ?? { topBorder: "border-t-zinc-700/50" };
  const canExpand   = group.jobs.length > COLLAPSED_COUNT;
  const hiddenCount = group.jobs.length - COLLAPSED_COUNT;

  return (
    <div
      className={`rounded-xl border border-white/[.08] border-t-2 ${moduleCfg.topBorder} bg-[#1b1b1e] overflow-hidden`}
    >
      {/* Header: prompt summary, metadata, expand toggle, action */}
      <GroupHeader
        group={group}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        showForm={showForm}
        onToggleForm={() => setShowForm((v) => !v)}
      />

      {/* Inline "new variation" form — toggled by group header button */}
      {showForm && group.prompt && (
        <div className="mx-4 mb-3 rounded-lg border border-[#9d4edd]/20 bg-[#131316] p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            새 변형 생성
          </p>
          <EditPromptForm
            moduleId={group.moduleId}
            initialPrompt={group.prompt}
            creditCost={group.latestJob.creditUsed}
          />
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-white/[.05]" />

      {/* Always-visible rows (first COLLAPSED_COUNT) */}
      <div className="py-1.5 space-y-0.5">
        {group.jobs.slice(0, COLLAPSED_COUNT).map((job, i) => (
          <VariationRow
            key={job.id}
            job={job}
            isNewest={i === 0}
            showNewestBadge={group.jobs.length > 1}
          />
        ))}
      </div>

      {/* Collapsible remainder — CSS grid animation (0fr → 1fr) */}
      {canExpand && (
        <div
          style={{ display: "grid", gridTemplateRows: expanded ? "1fr" : "0fr" }}
          className="transition-[grid-template-rows] duration-200 ease-in-out"
        >
          <div className="overflow-hidden">
            <div className="pb-1.5 space-y-0.5">
              {group.jobs.slice(COLLAPSED_COUNT).map((job) => (
                <VariationRow
                  key={job.id}
                  job={job}
                  isNewest={false}
                  showNewestBadge={false}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expand / collapse footer */}
      {canExpand && (
        <div className="border-t border-white/[.04] px-4 py-2.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-center text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {expanded ? "접기 ↑" : `${hiddenCount}개 더 보기 ↓`}
          </button>
        </div>
      )}
    </div>
  );
}
