"use client";

import { useState, useMemo } from "react";
import type { Job } from "@/lib/api";
import VariationGroup, { type VariationGroupData } from "./VariationGroup";

// ─── Filter ───────────────────────────────────────────────────────────────────

type FilterKey = "ALL" | "COMPLETED" | "RUNNING" | "PENDING" | "FAILED";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL",       label: "전체"    },
  { key: "COMPLETED", label: "완료"    },
  { key: "RUNNING",   label: "진행 중"  },
  { key: "PENDING",   label: "대기 중"  },
  { key: "FAILED",    label: "실패"    },
];

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
      <div className="rounded-full bg-zinc-800/60 p-5">
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
          <p className="text-sm font-medium text-zinc-400">해당 상태의 항목이 없습니다.</p>
          <p className="text-xs text-zinc-600">다른 필터를 선택해 보세요.</p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-zinc-400">아직 생성한 결과가 없습니다.</p>
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
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-4 py-3 space-y-0.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-base font-semibold text-zinc-100 tabular-nums">{value}</p>
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
      <div className="flex-1 border-t border-white/[.05]" />
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function JobHistoryView({ jobs }: { jobs: Job[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  // 1. Filter individual jobs, then build variation groups
  const filtered = useMemo(
    () => (activeFilter === "ALL" ? jobs : jobs.filter((j) => j.status === activeFilter)),
    [jobs, activeFilter]
  );
  const groups = useMemo(() => buildGroups(filtered), [filtered]);

  // 2. Time-section groups (ALL view only — filtered view uses flat list)
  const sections = useMemo(
    () => (activeFilter === "ALL" ? sectionByTime(groups) : null),
    [activeFilter, groups]
  );

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
      <div className="flex items-center gap-1 border-b border-white/[.08]">
        {FILTER_TABS.map(({ key, label }) => {
          const count    = key === "ALL" ? jobs.length : jobs.filter((j) => j.status === key).length;
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-[#9d4edd] text-[#e0b6ff]"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`text-xs tabular-nums ${isActive ? "text-[#c084fc]" : "text-zinc-700"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {groups.length === 0 ? (
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
