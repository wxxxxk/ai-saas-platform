"use client";

import { useState, useMemo } from "react";
import type { Job } from "@/lib/api";
import JobCard from "@/components/JobCard";

// ─── 필터 탭 설정 ──────────────────────────────────────────────────────────────

type FilterKey = "ALL" | "COMPLETED" | "RUNNING" | "PENDING" | "FAILED";

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "ALL",       label: "전체"   },
  { key: "COMPLETED", label: "완료"   },
  { key: "RUNNING",   label: "진행 중" },
  { key: "PENDING",   label: "대기 중" },
  { key: "FAILED",    label: "실패"   },
];

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

  return (
    <div className="space-y-6">

      {/* 통계 요약 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="전체 생성"    value={`${jobs.length}건`} />
        <StatCard label="완료"         value={`${completedCount}건`} />
        <StatCard label="실패"         value={`${failedCount}건`} />
        <StatCard label="사용 크레딧"  value={`${totalCredits} cr`} />
      </div>

      {/* 필터 탭 */}
      <div className="flex items-center gap-1 border-b border-white/[.08] pb-0">
        {FILTER_TABS.map(({ key, label }) => {
          const count = key === "ALL" ? jobs.length : jobs.filter((j) => j.status === key).length;
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
                <span className={`text-xs tabular-nums ${isActive ? "text-[#c084fc]" : "text-zinc-600"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
          <p className="text-sm text-zinc-500">
            {activeFilter === "ALL" ? "아직 생성된 항목이 없습니다." : "해당 상태의 항목이 없습니다."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
