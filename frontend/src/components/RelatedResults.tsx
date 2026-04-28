"use client";

import { useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/api";
import type { FavoritesApi } from "@/lib/useFavorites";
import CopyButton from "./CopyButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  currentJob: Job;
  relatedJobs: Job[]; // same prompt + module, different ID, latest-first, max 9
  favoritesApi?: FavoritesApi;
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

// ─── Star icon ────────────────────────────────────────────────────────────────

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

// ─── Star button ──────────────────────────────────────────────────────────────

function StarButton({
  isSelected,
  onToggle,
  alwaysVisible = false,
}: {
  isSelected: boolean;
  onToggle: () => void;
  alwaysVisible?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={isSelected ? "선택 해제" : "이 버전을 선택된 결과로 지정"}
      className={`group/star rounded-md p-1 transition-all duration-150 ${
        isSelected
          ? "text-amber-400"
          : `text-zinc-600 hover:text-amber-400 ${alwaysVisible ? "" : "opacity-0 group-hover:opacity-100"}`
      }`}
    >
      <StarIcon filled={isSelected} className="h-3.5 w-3.5" />
    </button>
  );
}

// ─── Text comparison ──────────────────────────────────────────────────────────

function TextComparison({
  current,
  related,
  groupKey,
  favoritesApi,
}: {
  current: Job;
  related: Job[];
  groupKey: string | null;
  favoritesApi?: FavoritesApi;
}) {
  const [target, setTarget] = useState<Job | null>(null);

  const isSelected = (jobId: string) =>
    !!(groupKey && favoritesApi?.isFavorite(groupKey, jobId));
  const toggle = (jobId: string) => {
    if (groupKey && favoritesApi) favoritesApi.toggleFavorite(groupKey, jobId);
  };

  function selectTarget(job: Job) {
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
          const selected   = isSelected(job.id);
          return (
            <button
              key={job.id}
              disabled={!canCompare}
              onClick={() => selectTarget(job)}
              title={canCompare ? "이 버전과 비교" : "완료된 결과만 비교할 수 있습니다"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "border-[#9d4edd]/50 bg-[#9d4edd]/10 text-primary-light"
                  : canCompare
                    ? "border-border bg-surface text-zinc-500 hover:border-black/[.15] dark:hover:border-white/[.15] hover:text-zinc-700 dark:hover:text-zinc-200"
                    : "border-border-faint bg-transparent text-zinc-500 opacity-50 cursor-not-allowed"
              }`}
            >
              <StatusDot status={job.status} />
              {relativeTime(job.createdAt)}
              {selected && <StarIcon filled className="h-3 w-3 text-amber-400" />}
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

      {/* Split view */}
      {target ? (
        <div className="grid md:grid-cols-2 gap-4">

          {/* LEFT — current (pinned) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-[#9d4edd]/60" />
                현재 버전
                {isSelected(current.id) && (
                  <StarIcon filled className="h-3.5 w-3.5 text-amber-400" />
                )}
              </span>
              <div className="flex items-center gap-1">
                {groupKey && favoritesApi && current.outputPayload && (
                  <StarButton
                    isSelected={isSelected(current.id)}
                    onToggle={() => toggle(current.id)}
                    alwaysVisible
                  />
                )}
                {current.outputPayload && <CopyButton text={current.outputPayload} />}
              </div>
            </div>
            <div
              className={`rounded-xl border-2 p-4 min-h-[180px] max-h-80 overflow-y-auto transition-colors ${
                isSelected(current.id)
                  ? "border-amber-500/30 bg-amber-950/10"
                  : "border-[#9d4edd]/25 bg-surface"
              }`}
            >
              <p className="text-sm text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-7">
                {current.outputPayload ?? ""}
              </p>
            </div>
          </div>

          {/* RIGHT — comparison target */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {relativeTime(target.createdAt)} 버전
                {isSelected(target.id) && (
                  <StarIcon filled className="h-3.5 w-3.5 text-amber-400" />
                )}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {groupKey && favoritesApi && target.outputPayload && (
                  <StarButton
                    isSelected={isSelected(target.id)}
                    onToggle={() => toggle(target.id)}
                    alwaysVisible
                  />
                )}
                {target.outputPayload && <CopyButton text={target.outputPayload} />}
                <Link
                  href={`/jobs/${target.id}`}
                  prefetch={false}
                  className="text-xs text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                >
                  상세 보기 →
                </Link>
              </div>
            </div>
            <div
              className={`rounded-xl border p-4 min-h-[180px] max-h-80 overflow-y-auto transition-colors ${
                isSelected(target.id)
                  ? "border-amber-500/25 bg-amber-950/10"
                  : "border-border bg-surface"
              }`}
            >
              {target.status === "COMPLETED" && target.outputPayload ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-7">
                  {target.outputPayload}
                </p>
              ) : target.status === "FAILED" ? (
                <p className="text-xs text-red-400 leading-relaxed">생성에 실패한 결과입니다.</p>
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <span className="h-3 w-3 animate-spin rounded-full border border-zinc-300 dark:border-zinc-700 border-t-zinc-500" />
                  처리 중…
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (

        <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-black/[.04] dark:divide-white/[.04]">
          {related.map((job) => {
            const canCompare = job.status === "COMPLETED" && !!job.outputPayload;
            const selected   = isSelected(job.id);
            return (
              <div
                key={job.id}
                className={`group flex items-center gap-3 px-4 py-3 hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors ${
                  selected ? "bg-amber-500/[.03]" : ""
                }`}
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
                <div className="flex items-center gap-2 shrink-0">
                  {selected && (
                    <StarIcon filled className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                  {groupKey && favoritesApi && canCompare && (
                    <StarButton
                      isSelected={selected}
                      onToggle={() => toggle(job.id)}
                    />
                  )}
                  {canCompare && (
                    <button
                      onClick={() => selectTarget(job)}
                      className="text-xs text-zinc-500 hover:text-primary-light transition-colors"
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

function ImageGallery({
  current,
  related,
  groupKey,
  favoritesApi,
}: {
  current: Job;
  related: Job[];
  groupKey: string | null;
  favoritesApi?: FavoritesApi;
}) {
  const all = [current, ...related];

  const isSelected = (jobId: string) =>
    !!(groupKey && favoritesApi?.isFavorite(groupKey, jobId));
  const toggle = (jobId: string) => {
    if (groupKey && favoritesApi) favoritesApi.toggleFavorite(groupKey, jobId);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {all.map((job, i) => {
        const isCurrent  = job.id === current.id;
        const hasImage   = job.status === "COMPLETED" && !!job.outputPayload;
        const selected   = isSelected(job.id);
        const canSelect  = hasImage && !!groupKey && !!favoritesApi;

        return (
          <div key={job.id} className="space-y-1.5">

            {/* Thumbnail */}
            <div
              className={`relative rounded-lg overflow-hidden aspect-square bg-zinc-200 dark:bg-zinc-900 border-2 transition-all ${
                selected
                  ? "border-amber-500/60 ring-1 ring-amber-500/25"
                  : isCurrent
                    ? "border-[#9d4edd]/50 ring-1 ring-[#9d4edd]/25"
                    : "border-border hover:border-black/[.16] dark:hover:border-white/[.16]"
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

              {selected && (
                <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-500 px-1.5 py-px">
                  <StarIcon filled className="h-2.5 w-2.5 text-white" />
                  <span className="text-[9px] font-bold text-white leading-tight tracking-wide">선택됨</span>
                </span>
              )}
              {!selected && isCurrent && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-[#9d4edd] px-1.5 py-px text-[9px] font-bold text-white leading-tight tracking-wide">
                  현재
                </span>
              )}

              {canSelect && (
                <button
                  type="button"
                  onClick={() => toggle(job.id)}
                  title={selected ? "선택 해제" : "이 버전 선택하기"}
                  className={`absolute top-1.5 right-1.5 rounded-md p-0.5 transition-all duration-150 ${
                    selected
                      ? "text-amber-400 bg-black/40 opacity-100"
                      : "text-white/60 bg-black/0 hover:bg-black/40 hover:text-amber-400 opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <StarIcon filled={selected} className="h-3.5 w-3.5" />
                </button>
              )}

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
              <span className={`text-[10px] tabular-nums ${selected ? "text-amber-400 font-medium" : "text-zinc-600"}`}>
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

// ─── Simple list ──────────────────────────────────────────────────────────────

function RelatedList({
  related,
  groupKey,
  favoritesApi,
}: {
  related: Job[];
  groupKey: string | null;
  favoritesApi?: FavoritesApi;
}) {
  const isSelected = (jobId: string) =>
    !!(groupKey && favoritesApi?.isFavorite(groupKey, jobId));
  const toggle = (jobId: string) => {
    if (groupKey && favoritesApi) favoritesApi.toggleFavorite(groupKey, jobId);
  };

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden divide-y divide-black/[.04] dark:divide-white/[.04]">
      {related.map((job) => {
        const canSelect = job.status === "COMPLETED" && !!job.outputPayload && !!groupKey && !!favoritesApi;
        const selected  = isSelected(job.id);
        return (
          <div
            key={job.id}
            className={`group flex items-center gap-3 px-4 py-3 hover:bg-black/[.02] dark:hover:bg-white/[.02] transition-colors ${
              selected ? "bg-amber-500/[.03]" : ""
            }`}
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
            <div className="flex items-center gap-2 shrink-0">
              {selected && <StarIcon filled className="h-3.5 w-3.5 text-amber-400" />}
              {canSelect && (
                <StarButton isSelected={selected} onToggle={() => toggle(job.id)} />
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
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RelatedResults({ currentJob, relatedJobs, favoritesApi }: Props) {
  if (relatedJobs.length === 0) return null;

  const isImage       = currentJob.moduleName === "IMAGE_GENERATION";
  const isCurrentDone = currentJob.status === "COMPLETED" && !!currentJob.outputPayload;

  const groupKey = currentJob.inputPayload
    ? `${currentJob.moduleName}::${currentJob.inputPayload}`
    : null;

  const anySelected = !!(
    groupKey &&
    favoritesApi &&
    [...relatedJobs, currentJob].some((j) => favoritesApi.isFavorite(groupKey, j.id))
  );

  return (
    <section className="rounded-xl border border-border bg-surface-low p-6 space-y-5">

      {/* Section header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            같은 아이디어 · 다른 결과
          </p>
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
            {relatedJobs.length}개의 이전 버전
            {anySelected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-2 py-0.5">
                <StarIcon filled className="h-2.5 w-2.5" />
                버전 선택됨
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {isImage
              ? "같은 프롬프트로 생성된 이미지 변형들입니다. 별표로 최적 버전을 선택하세요."
              : "같은 프롬프트로 생성된 텍스트 버전들입니다. 비교 후 최적 버전을 선택하세요."}
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium text-zinc-600 border border-border-faint rounded-full px-2.5 py-0.5 tabular-nums">
          {relatedJobs.length}개
        </span>
      </div>

      {/* Content — three modes */}
      {isImage ? (
        <ImageGallery
          current={currentJob}
          related={relatedJobs}
          groupKey={groupKey}
          favoritesApi={favoritesApi}
        />
      ) : isCurrentDone ? (
        <TextComparison
          current={currentJob}
          related={relatedJobs}
          groupKey={groupKey}
          favoritesApi={favoritesApi}
        />
      ) : (
        <RelatedList
          related={relatedJobs}
          groupKey={groupKey}
          favoritesApi={favoritesApi}
        />
      )}

    </section>
  );
}
