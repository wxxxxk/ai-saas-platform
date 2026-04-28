"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Job } from "@/lib/api";
import VariationGroup, { type VariationGroupData } from "./VariationGroup";
import { useFavorites } from "@/lib/useFavorites";

// ─── Filter ───────────────────────────────────────────────────────────────────

type FilterKey = "ALL" | "COMPLETED" | "RUNNING" | "PENDING" | "FAILED" | "SELECTED";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL",       label: "전체"    },
  { key: "COMPLETED", label: "완료"    },
  { key: "RUNNING",   label: "진행 중"  },
  { key: "PENDING",   label: "대기 중"  },
  { key: "FAILED",    label: "실패"    },
  { key: "SELECTED",  label: "선택됨"  },
];

// ─── Module config (local subset for selected cards) ──────────────────────────

const MODULE_CFG_SELECTED: Record<string, { label: string; badge: string; accentFrom: string }> = {
  IMAGE_GENERATION: { label: "Image",     badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",   accentFrom: "from-purple-500/20"  },
  TEXT_GENERATION:  { label: "Text",      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", accentFrom: "from-emerald-500/20" },
  SUMMARIZATION:    { label: "Summary",   badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",   accentFrom: "from-orange-500/20"  },
  TRANSLATION:      { label: "Translate", badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",               accentFrom: "from-sky-500/20"     },
};

// ─── Star icon (local copy — used by SelectedCard) ───────────────────────────

function StarIconFilled({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005z" />
    </svg>
  );
}

// ─── Selected items type ──────────────────────────────────────────────────────

type SelectedItem = { group: VariationGroupData; job: Job };

// ─── Selected card ────────────────────────────────────────────────────────────

function SelectedCard({ item }: { item: SelectedItem }) {
  const { group, job } = item;
  const isImage   = job.moduleName === "IMAGE_GENERATION";
  const modCfg    = MODULE_CFG_SELECTED[job.moduleName] ?? {
    label: job.moduleName,
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    accentFrom: "from-zinc-500/10",
  };

  const relTime = (() => {
    const diff = Date.now() - new Date(job.createdAt).getTime();
    const mins = Math.floor(diff / 60_000);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1)  return "방금 전";
    if (mins < 60) return `${mins}분 전`;
    if (hrs  < 24) return `${hrs}시간 전`;
    return `${days}일 전`;
  })();

  return (
    <div className="group/card flex flex-col rounded-xl border border-amber-500/20 bg-surface-low overflow-hidden hover:border-amber-500/40 transition-all duration-200">

      {/* Accent line — module colour bleeds into amber */}
      <div className={`h-px bg-gradient-to-r ${modCfg.accentFrom} via-amber-500/15 to-transparent`} />

      <div className="flex flex-col flex-1 p-5 space-y-3.5">

        {/* Header row — module badge + selected pill */}
        <div className="flex items-center justify-between gap-2">
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${modCfg.badge}`}>
            {modCfg.label}
          </span>
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-full px-2 py-0.5">
            <StarIconFilled className="h-2.5 w-2.5" />
            선택됨
          </span>
        </div>

        {/* Prompt */}
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 line-clamp-2 leading-snug">
          {group.prompt ?? (
            <span className="italic text-zinc-600">프롬프트 없음</span>
          )}
        </p>

        {/* Output preview */}
        {isImage && job.outputPayload ? (
          <div className="overflow-hidden rounded-lg border border-amber-500/15 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={job.outputPayload}
              alt=""
              className="w-full h-44 object-cover"
              loading="lazy"
            />
          </div>
        ) : job.outputPayload ? (
          <p className="text-xs text-zinc-500 line-clamp-4 leading-relaxed rounded-lg border border-border-faint bg-surface px-3.5 py-3">
            {job.outputPayload.slice(0, 220)}
          </p>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-1">
          <div className="flex items-center gap-3 text-[11px] text-zinc-600 tabular-nums">
            {group.jobs.length > 1 && (
              <span>{group.jobs.length}개 변형</span>
            )}
            <span>{relTime}</span>
          </div>

          <Link
            href={`/jobs/${job.id}`}
            prefetch={false}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-100 hover:border-amber-500/30 hover:bg-amber-500/[.04] transition-all"
          >
            워크스페이스 열기
            <span className="text-zinc-600 group-hover/card:text-amber-400 transition-colors">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Selected empty state ─────────────────────────────────────────────────────

function SelectedEmptyState({ onGoToAll }: { onGoToAll: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
      <div className="rounded-full bg-amber-500/[.07] border border-amber-500/20 p-5">
        <svg
          className="h-8 w-8 text-amber-400/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      </div>

      <div className="space-y-2 max-w-xs">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">아직 선택된 결과가 없습니다</p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          각 아이디어의 결과 목록에서 별표(★)를 눌러 최선의 버전을 선택해 두세요.
          선택한 결과들이 여기서 한눈에 모입니다.
        </p>
      </div>

      <button
        type="button"
        onClick={onGoToAll}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-100 hover:border-black/[.2] dark:hover:border-white/[.2] transition-all"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        히스토리로 돌아가기
      </button>
    </div>
  );
}

// ─── Selected view ────────────────────────────────────────────────────────────

function SelectedView({
  items,
  onGoToAll,
}: {
  items: SelectedItem[];
  onGoToAll: () => void;
}) {
  if (items.length === 0) {
    return <SelectedEmptyState onGoToAll={onGoToAll} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-600">
        <span className="text-amber-400/80 font-medium tabular-nums">{items.length}개</span>의 결과가 선택되어 있습니다
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <SelectedCard key={item.job.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// ─── Grouping ─────────────────────────────────────────────────────────────────
//
// Jobs with the same (moduleName + inputPayload) are one "variation family".
// Jobs without a prompt are ungroupable → each becomes a solo group of one.
// Groups are ordered by their most recently updated job (most-active idea first).

function buildGroups(jobs: Job[]): VariationGroupData[] {
  const map = new Map<string, Job[]>();

  for (const job of jobs) {
    const key = job.inputPayload
      ? `${job.moduleName}::${job.inputPayload}`
      : `__solo__${job.id}`;
    const bucket = map.get(key) ?? [];
    bucket.push(job);
    map.set(key, bucket);
  }

  const groups: VariationGroupData[] = [];

  for (const [key, groupJobs] of map.entries()) {
    const sorted = [...groupJobs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latest = sorted[0];
    groups.push({
      key,
      moduleName: latest.moduleName,
      moduleId:   latest.moduleId,
      prompt:     latest.inputPayload,
      jobs:       sorted,
      latestJob:  latest,
    });
  }

  return groups.sort(
    (a, b) =>
      new Date(b.latestJob.createdAt).getTime() -
      new Date(a.latestJob.createdAt).getTime()
  );
}

// ─── Time sectioning (for ALL view only) ─────────────────────────────────────
//
// Groups are bucketed by their latestJob.createdAt into:
//   오늘 / 이번 주 (7 days) / 이전

type TimeSection = { label: string; groups: VariationGroupData[] };

function sectionByTime(groups: VariationGroupData[]): TimeSection[] {
  const now        = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo    = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const today: VariationGroupData[]    = [];
  const thisWeek: VariationGroupData[] = [];
  const earlier: VariationGroupData[]  = [];

  for (const g of groups) {
    const d = new Date(g.latestJob.createdAt);
    if      (d >= todayStart) today.push(g);
    else if (d >= weekAgo)    thisWeek.push(g);
    else                      earlier.push(g);
  }

  const sections: TimeSection[] = [];
  if (today.length)    sections.push({ label: "오늘",    groups: today    });
  if (thisWeek.length) sections.push({ label: "이번 주", groups: thisWeek });
  if (earlier.length)  sections.push({ label: "이전",    groups: earlier  });
  return sections;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
      <div className="rounded-full bg-zinc-100 dark:bg-zinc-800/60 p-5">
        <svg
          className="h-8 w-8 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      {isFiltered ? (
        <>
          <p className="text-sm font-medium text-zinc-500">해당 상태의 항목이 없습니다.</p>
          <p className="text-xs text-zinc-600">다른 필터를 선택해 보세요.</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-zinc-500">아직 생성한 결과가 없습니다.</p>
          <p className="text-xs text-zinc-600">
            대시보드에서 모듈을 선택하고 첫 번째 콘텐츠를 만들어 보세요.
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-low px-4 py-3 space-y-0.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100 tabular-nums">{value}</p>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 shrink-0">
        {label}
      </h3>
      <span className="text-xs text-zinc-700 tabular-nums shrink-0">{count}</span>
      <div className="flex-1 border-t border-border-faint" />
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function JobHistoryView({ jobs }: { jobs: Job[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  // Favorites store — hydrates from localStorage after mount
  const { getFavoriteJobId } = useFavorites();

  // All groups — always over the full job list (needed for SELECTED tab)
  const allGroups = useMemo(() => buildGroups(jobs), [jobs]);

  // 1. Filter individual jobs, then build variation groups (status tabs only)
  const filtered = useMemo(
    () =>
      activeFilter === "ALL" || activeFilter === "SELECTED"
        ? jobs
        : jobs.filter((j) => j.status === activeFilter),
    [jobs, activeFilter]
  );
  const groups = useMemo(
    () => (activeFilter === "ALL" || activeFilter === "SELECTED" ? allGroups : buildGroups(filtered)),
    [activeFilter, allGroups, filtered]
  );

  // 2. Time-section groups (ALL view only — filtered view uses flat list)
  const sections = useMemo(
    () => (activeFilter === "ALL" ? sectionByTime(groups) : null),
    [activeFilter, groups]
  );

  // 3. Selected items — groups that have a chosen variation
  const selectedItems = useMemo<SelectedItem[]>(() => {
    return allGroups.flatMap((group) => {
      if (!group.prompt) return []; // solo groups without prompt are not selectable
      const selectedJobId = getFavoriteJobId(group.key);
      if (!selectedJobId) return [];
      const job = group.jobs.find((j) => j.id === selectedJobId);
      if (!job) return [];
      return [{ group, job }];
    });
  }, [allGroups, getFavoriteJobId]);

  // Stats — always over full, unfiltered job list
  const totalCredits   = useMemo(() => jobs.reduce((s, j) => s + j.creditUsed, 0), [jobs]);
  const completedCount = useMemo(() => jobs.filter((j) => j.status === "COMPLETED").length, [jobs]);
  const totalIdeas     = useMemo(() => {
    const keys = new Set(
      jobs.map((j) =>
        j.inputPayload ? `${j.moduleName}::${j.inputPayload}` : `__solo__${j.id}`
      )
    );
    return keys.size;
  }, [jobs]);

  return (
    <div className="space-y-6">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="전체 생성"   value={`${jobs.length}건`}     />
        <StatCard label="아이디어"    value={`${totalIdeas}개`}      />
        <StatCard label="완료"        value={`${completedCount}건`}  />
        <StatCard label="사용 크레딧" value={`${totalCredits} cr`}   />
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        {FILTER_TABS.map(({ key, label }) => {
          const isSelected = key === "SELECTED";
          const count      = isSelected
            ? selectedItems.length
            : key === "ALL"
              ? jobs.length
              : jobs.filter((j) => j.status === key).length;
          const isActive   = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? isSelected
                    ? "border-amber-500 text-amber-300"
                    : "border-[#9d4edd] text-[#e0b6ff]"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {isSelected && (
                <StarIconFilled
                  className={`h-3 w-3 ${isActive ? "text-amber-400" : "text-zinc-600"}`}
                />
              )}
              {label}
              {(count > 0 || isSelected) && (
                <span
                  className={`text-xs tabular-nums ${
                    isActive
                      ? isSelected
                        ? "text-amber-400/80"
                        : "text-[#c084fc]"
                      : "text-zinc-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {activeFilter === "SELECTED" ? (
        <SelectedView
          items={selectedItems}
          onGoToAll={() => setActiveFilter("ALL")}
        />

      ) : groups.length === 0 ? (
        <EmptyState isFiltered={activeFilter !== "ALL"} />

      ) : sections ? (
        /* ALL — time-sectioned groups */
        <div className="space-y-8">
          {sections.map(({ label, groups: sectionGroups }) => (
            <div key={label}>
              <SectionHeader label={label} count={sectionGroups.length} />
              <div className="space-y-3">
                {sectionGroups.map((group) => (
                  <VariationGroup key={group.key} group={group} />
                ))}
              </div>
            </div>
          ))}
        </div>

      ) : (
        /* Filtered — flat list */
        <div className="space-y-3">
          {groups.map((group) => (
            <VariationGroup key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
