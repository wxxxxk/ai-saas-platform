"use client";

import { useState, useMemo } from "react";
import type { Job } from "@/lib/api";
import JobCard from "@/components/JobCard";

// ─── 필터 탭 설정 ──────────────────────────────────────────────────────────────

type FilterKey = "ALL" | "COMPLETED" | "RUNNING" | "PENDING" | "FAILED";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL",       label: "전체"    },
  { key: "COMPLETED", label: "완료"    },
  { key: "RUNNING",   label: "진행 중"  },
  { key: "PENDING",   label: "대기 중"  },
  { key: "FAILED",    label: "실패"    },
];

// ─── 시간 그룹 ─────────────────────────────────────────────────────────────────

type TimeGroup = { label: string; jobs: Job[] };

/**
 * 최신순 정렬된 Job 배열을 오늘 / 이번 주 / 이전으로 나눈다.
 * 클라이언트에서 실행되므로 new Date()는 사용자 로컬 시각을 기준으로 한다.
 */
function groupByTime(jobs: Job[]): TimeGroup[] {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const weekAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const today: Job[]    = [];
  const thisWeek: Job[] = [];
  const earlier: Job[]  = [];

  for (const job of jobs) {
    const d = new Date(job.createdAt);
    if (d >= todayStart)   today.push(job);
    else if (d >= weekAgo) thisWeek.push(job);
    else                   earlier.push(job);
  }

  const groups: TimeGroup[] = [];
  if (today.length)    groups.push({ label: "오늘",    jobs: today    });
  if (thisWeek.length) groups.push({ label: "이번 주", jobs: thisWeek });
  if (earlier.length)  groups.push({ label: "이전",    jobs: earlier  });

  return groups;
}

// ─── 빈 상태 ───────────────────────────────────────────────────────────────────

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

// ─── 시간 그룹 헤더 ────────────────────────────────────────────────────────────

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 shrink-0">
        {label}
      </h3>
      <span className="text-xs text-zinc-700 tabular-nums shrink-0">{count}</span>
      <div className="flex-1 border-t border-white/[.05]" />
    </div>
  );
}

// ─── 통계 카드 ─────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-4 py-3 space-y-0.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-base font-semibold text-zinc-100 tabular-nums">{value}</p>
    </div>
  );
}

// ─── 메인 뷰 ──────────────────────────────────────────────────────────────────

export default function JobHistoryView({ jobs }: { jobs: Job[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

  const filtered = useMemo(() => {
    if (activeFilter === "ALL") return jobs;
    return jobs.filter((j) => j.status === activeFilter);
  }, [jobs, activeFilter]);

  const totalCredits = useMemo(
    () => jobs.reduce((sum, j) => sum + j.creditUsed, 0),
    [jobs]
  );

  const completedCount = jobs.filter((j) => j.status === "COMPLETED").length;
  const failedCount    = jobs.filter((j) => j.status === "FAILED").length;

  // 시간 그룹 — 전체 보기일 때만 적용
  const timeGroups = useMemo(
    () => (activeFilter === "ALL" ? groupByTime(filtered) : null),
    [activeFilter, filtered]
  );

  return (
    <div className="space-y-6">

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="전체 생성"   value={`${jobs.length}건`}        />
        <StatCard label="완료"        value={`${completedCount}건`}     />
        <StatCard label="실패"        value={`${failedCount}건`}        />
        <StatCard label="사용 크레딧" value={`${totalCredits} cr`}      />
      </div>

      {/* 필터 탭 */}
      <div className="flex items-center gap-1 border-b border-white/[.08]">
        {FILTER_TABS.map(({ key, label }) => {
          const count =
            key === "ALL"
              ? jobs.length
              : jobs.filter((j) => j.status === key).length;
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
                <span
                  className={`text-xs tabular-nums ${
                    isActive ? "text-[#c084fc]" : "text-zinc-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      {filtered.length === 0 ? (
        <EmptyState isFiltered={activeFilter !== "ALL"} />
      ) : timeGroups ? (
        // 전체 보기: 시간 그룹별로 카드 표시
        <div className="space-y-8">
          {timeGroups.map(({ label, jobs: groupJobs }) => (
            <div key={label}>
              <GroupHeader label={label} count={groupJobs.length} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 필터 적용 시: 플랫 그리드
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
