export default function JobDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-7 animate-pulse">

      {/* 브레드크럼 스켈레톤 */}
      <div className="h-4 w-20 rounded bg-white/[.05]" />

      {/* 페이지 헤더 스켈레톤 */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 rounded-full bg-white/[.06]" />
          <div className="h-5 w-14 rounded-full bg-white/[.04]" />
        </div>
        <div className="h-7 w-36 rounded-lg bg-white/[.07]" />
        <div className="h-3 w-40 rounded bg-white/[.04]" />
      </div>

      {/* 2단 레이아웃 스켈레톤 */}
      <div className="grid lg:grid-cols-[1fr_288px] gap-6 items-start">

        {/* 메인 콘텐츠 */}
        <div className="space-y-5">
          {/* 프롬프트 섹션 */}
          <div className="space-y-2.5">
            <div className="h-3 w-24 rounded bg-white/[.04]" />
            <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5 py-4 space-y-2">
              <div className="h-4 w-full rounded bg-white/[.05]" />
              <div className="h-4 w-4/5 rounded bg-white/[.04]" />
              <div className="h-4 w-3/5 rounded bg-white/[.03]" />
            </div>
          </div>

          {/* 결과 섹션 */}
          <div className="space-y-2.5">
            <div className="h-3 w-28 rounded bg-white/[.04]" />
            <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 space-y-3">
              <div className="h-48 rounded-lg bg-white/[.04]" />
              <div className="h-4 w-full rounded bg-white/[.04]" />
              <div className="h-4 w-5/6 rounded bg-white/[.03]" />
              <div className="h-4 w-4/6 rounded bg-white/[.03]" />
            </div>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 상태 카드 */}
          <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 space-y-3">
            <div className="h-3 w-12 rounded bg-white/[.04]" />
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-white/[.06]" />
              <div className="h-4 w-16 rounded bg-white/[.05]" />
            </div>
          </div>

          {/* 액션 카드 */}
          <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 space-y-3">
            <div className="h-3 w-16 rounded bg-white/[.04]" />
            <div className="h-8 w-24 rounded-lg bg-white/[.05]" />
          </div>

          {/* 계속 작업 카드 */}
          <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 space-y-3">
            <div className="h-3 w-24 rounded bg-white/[.04]" />
            <div className="h-24 rounded-lg bg-white/[.04]" />
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 rounded bg-white/[.04]" />
              <div className="h-8 w-28 rounded-lg bg-white/[.06]" />
            </div>
          </div>

          {/* 상세 정보 카드 */}
          <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 space-y-4">
            <div className="h-3 w-16 rounded bg-white/[.04]" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-14 rounded bg-white/[.04]" />
                <div className="h-3 w-32 rounded bg-white/[.05]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
