"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/api";
import CopyButton from "./CopyButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  currentJob: Job;
  relatedJobs: Job[]; // same prompt + module, different ID, latest-first, max 9
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs   = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs  = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  if (diffMins < 1)  return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHrs  < 24) return `${diffHrs}시간 전`;
  return `${diffDays}일 전`;
}

const STATUS_DOT: Record<string, string> = {
  COMPLETED: "bg-green-500",
  FAILED:    "bg-red-500",
  RUNNING:   "bg-blue-400 animate-pulse",
  PENDING:   "bg-zinc-500",
  CANCELLED: "bg-zinc-600",
};

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[status] ?? "bg-zinc-500"}`}
    />
  );
}

// ─── Text comparison ──────────────────────────────────────────────────────────
//
// Default: compact list with "비교하기" toggle buttons.
// When a comparison target is active: side-by-side split view with both texts.
// Current result is always "pinned" to the left panel.

function TextComparison({
  current,
  related,
}: {
  current: Job;
  related: Job[];
}) {
  const [target, setTarget] = useState<Job | null>(null);

  function toggle(job: Job) {
    setTarget((prev) => (prev?.id === job.id ? null : job));
  }

  return (
    <div className="space-y-4">

      {/* Version selector chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-700 mr-1">
          버전 선택
        </span>
        {related.map((job) => {
          const isActive   = target?.id === job.id;
          const canCompare = job.status === "COMPLETED" && !!job.outputPayload;
          return (
            <button
              key={job.id}
              disabled={!canCompare}
              onClick={() => toggle(job)}
              title={canCompare ? "이 버전과 비교" : "완료된 결과만 비교할 수 있습니다"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "border-[#9d4edd]/50 bg-[#9d4edd]/10 text-[#e0b6ff]"
                  : canCompare
                    ? "border-white/[.08] bg-[#131316] text-zinc-400 hover:border-white/[.15] hover:text-zinc-200"
                    : "border-white/[.04] bg-transparent text-zinc-700 opacity-50 cursor-not-allowed"
              }`}
            >
              <StatusDot status={job.status} />
              {relativeTime(job.createdAt)}
              {isActive && (
                <span className="text-[9px] font-semibold text-[#c084fc] ml-0.5">비교 중</span>
              )}
            </button>
          );
        })}
        {target && (
          <button
            onClick={() => setTarget(null)}
            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors ml-1"
          >
            닫기 ×
          </button>
        )}
      </div>

      {/* Split view when a target is selected */}
      {target ? (
        <div className="grid md:grid-cols-2 gap-4">

          {/* LEFT — current (always pinned) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-[#9d4edd]/60" />
                현재 버전
              </span>
              {current.outputPayload && (
                <CopyButton text={current.outputPayload} />
              )}
            </div>
            <div className="rounded-xl border-2 border-[#9d4edd]/25 bg-[#131316] p-4 min-h-[180px] max-h-80 overflow-y-auto">
              <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-7">
                {current.outputPayload ?? ""}
              </p>
            </div>
          </div>

          {/* RIGHT — comparison target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {relativeTime(target.createdAt)} 버전
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {target.outputPayload && (
                  <CopyButton text={target.outputPayload} />
                )}
                <Link
                  href={`/jobs/${target.id}`}
                  prefetch={false}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  상세 보기 →
                </Link>
              </div>
            </div>
            <div className="rounded-xl border border-white/[.08] bg-[#131316] p-4 min-h-[180px] max-h-80 overflow-y-auto">
              {target.status === "COMPLETED" && target.outputPayload ? (
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-7">
                  {target.outputPayload}
                </p>
              ) : target.status === "FAILED" ? (
                <p className="text-xs text-red-400 leading-relaxed">생성에 실패한 결과입니다.</p>
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <span className="h-3 w-3 animate-spin rounded-full border border-zinc-700 border-t-zinc-500" />
                  처리 중…
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (

        /* Compact list — default state before a comparison is selected */
        <div className="rounded-xl border border-white/[.08] bg-[#131316] overflow-hidden divide-y divide-white/[.04]">
          {related.map((job) => {
            const canCompare = job.status === "COMPLETED" && !!job.outputPayload;
            return (
              <div
                key={job.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[.02] transition-colors"
              >
                <StatusDot status={job.status} />
                <span className="text-xs text-zinc-500 tabular-nums shrink-0">
                  {relativeTime(job.createdAt)}
                </span>
                <p className="flex-1 min-w-0 text-xs text-zinc-600 truncate">
                  {job.outputPayload
                    ? job.outputPayload.slice(0, 90)
                    : job.status === "FAILED"
                      ? "생성 실패"
                      : "처리 중…"}
                </p>
                <div className="flex items-center gap-3 shrink-0">
                  {canCompare && (
                    <button
                      onClick={() => toggle(job)}
                      className="text-xs text-zinc-500 hover:text-[#e0b6ff] transition-colors"
                    >
                      비교하기
                    </button>
                  )}
                  <Link
                    href={`/jobs/${job.id}`}
                    prefetch={false}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    보기 →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Image gallery ────────────────────────────────────────────────────────────
//
// Shows current job (with purple ring + "현재" badge) alongside all
// related image variations as a responsive thumbnail grid.
// Clicking any non-current thumbnail navigates to that job's detail page.

function ImageGallery({
  current,
  related,
}: {
  current: Job;
  related: Job[];
}) {
  const all = [current, ...related];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {all.map((job, i) => {
        const isCurrent = job.id === current.id;
        const hasImage  = job.status === "COMPLETED" && !!job.outputPayload;

        return (
          <div key={job.id} className="space-y-1.5">

            {/* Thumbnail */}
            <div
              className={`relative rounded-lg overflow-hidden aspect-square bg-zinc-900 border transition-all ${
                isCurrent
                  ? "border-[#9d4edd]/50 ring-1 ring-[#9d4edd]/25"
                  : "border-white/[.08] hover:border-white/[.16]"
              }`}
            >
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.outputPayload!}
                  alt={`Variation ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <StatusDot status={job.status} />
                </div>
              )}

              {/* "현재" badge */}
              {isCurrent && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-[#9d4edd] px-1.5 py-px text-[9px] font-bold text-white leading-tight tracking-wide">
                  현재
                </span>
              )}

              {/* Hover overlay link for non-current */}
              {!isCurrent && (
                <Link
                  href={`/jobs/${job.id}`}
                  prefetch={false}
                  className="absolute inset-0 flex items-end justify-end p-1.5 bg-black/0 hover:bg-black/40 transition-colors group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                    보기 →
                  </span>
                </Link>
              )}
            </div>

            {/* Label */}
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] text-zinc-600 tabular-nums">
                {isCurrent ? "현재" : relativeTime(job.createdAt)}
              </span>
              {!isCurrent && (
                <Link
                  href={`/jobs/${job.id}`}
                  prefetch={false}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  보기 →
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Simple list (current job is not yet COMPLETED) ───────────────────────────
//
// Shows related results as a navigable list when the current job is still
// in-progress or failed and can't anchor a comparison.

function RelatedList({ related }: { related: Job[] }) {
  return (
    <div className="rounded-xl border border-white/[.08] bg-[#131316] overflow-hidden divide-y divide-white/[.04]">
      {related.map((job) => (
        <div
          key={job.id}
          className="flex items-center gap-3 px-4 py-3 hover:bg-white/[.02] transition-colors"
        >
          <StatusDot status={job.status} />
          <span className="text-xs text-zinc-500 tabular-nums shrink-0">
            {relativeTime(job.createdAt)}
          </span>
          <p className="flex-1 min-w-0 text-xs text-zinc-600 truncate">
            {job.status === "COMPLETED" && job.outputPayload
              ? job.outputPayload.slice(0, 90)
              : job.status === "FAILED"
                ? "생성 실패"
                : "처리 중…"}
          </p>
          <Link
            href={`/jobs/${job.id}`}
            prefetch={false}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors shrink-0"
          >
            보기 →
          </Link>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RelatedResults({ currentJob, relatedJobs }: Props) {
  if (relatedJobs.length === 0) return null;

  const isImage          = currentJob.moduleName === "IMAGE_GENERATION";
  const isCurrentDone    = currentJob.status === "COMPLETED" && !!currentJob.outputPayload;

  return (
    <section className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-6 space-y-5">

      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            같은 아이디어 · 다른 결과
          </p>
          <h2 className="text-sm font-semibold text-zinc-200">
            {relatedJobs.length}개의 이전 버전
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {isImage
              ? "같은 프롬프트로 생성된 이미지 변형들입니다. 클릭해서 비교해 보세요."
              : "같은 프롬프트로 생성된 텍스트 버전들입니다. 버전을 선택해 나란히 비교해 보세요."}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-zinc-600 border border-white/[.06] rounded-full px-2.5 py-0.5 tabular-nums">
          {relatedJobs.length}개
        </span>
      </div>

      {/* Content — three modes */}
      {isImage ? (
        <ImageGallery current={currentJob} related={relatedJobs} />
      ) : isCurrentDone ? (
        <TextComparison current={currentJob} related={relatedJobs} />
      ) : (
        <RelatedList related={relatedJobs} />
      )}

    </section>
  );
}
