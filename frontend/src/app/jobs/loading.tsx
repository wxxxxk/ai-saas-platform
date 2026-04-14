export default function JobsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      {/* 헤더 스켈레톤 */}
      <div className="space-y-2">
        <div className="h-7 w-28 rounded-lg bg-white/[.06] animate-pulse" />
        <div className="h-4 w-48 rounded bg-white/[.04] animate-pulse" />
      </div>

      {/* 통계 스켈레톤 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-4 py-3 space-y-1.5">
            <div className="h-3 w-16 rounded bg-white/[.05] animate-pulse" />
            <div className="h-5 w-10 rounded bg-white/[.07] animate-pulse" />
          </div>
        ))}
      </div>

      {/* 탭 스켈레톤 */}
      <div className="flex gap-4 border-b border-white/[.08] pb-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-12 rounded bg-white/[.05] animate-pulse mb-2" />
        ))}
      </div>

      {/* 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 rounded-full bg-white/[.06] animate-pulse" />
              <div className="h-5 w-14 rounded-full bg-white/[.04] animate-pulse" />
            </div>
            <div className="h-[6.5rem] rounded-lg bg-white/[.04] animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-white/[.04] animate-pulse" />
            <div className="flex justify-between">
              <div className="h-3 w-12 rounded bg-white/[.04] animate-pulse" />
              <div className="h-3 w-20 rounded bg-white/[.04] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
