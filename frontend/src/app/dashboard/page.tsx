export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import JobCard from "@/components/JobCard";
import ModuleCard from "@/components/ModuleCard";
import TopUpForm from "@/components/TopUpForm";
import { AuthError, getJobs, getMe, getModules, type AiModule, type Job, type MeResponse } from "@/lib/api";

// ─── 온보딩 배너 — jobs가 0개일 때만 stat grid 대신 표시 ───────────────────────
//
// 크레딧 잔액을 기반으로 "텍스트 N회 / 이미지 N회 가능" 계산값을 보여주고
// #modules 앵커로 즉시 행동할 수 있는 CTA를 제공한다.

const TEXT_COST  = 10;
const IMAGE_COST = 30;

function WelcomeBanner({ creditBalance }: { creditBalance: number }) {
  const textCount  = Math.floor(creditBalance / TEXT_COST);
  const imageCount = Math.floor(creditBalance / IMAGE_COST);

  return (
    <div className="rounded-xl border border-[#9d4edd]/20 bg-[#9d4edd]/[.05] px-6 py-6 space-y-5">
      {/* 상단: 인사 + 크레딧 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-100">시작할 준비가 됐습니다</p>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
            아래 모듈 카드에서 프롬프트를 입력하고 <strong className="text-zinc-400 font-medium">Generate</strong>를 누르면
            첫 번째 AI 결과가 즉시 생성됩니다.
          </p>
        </div>
        <div className="shrink-0 rounded-lg border border-[#9d4edd]/25 bg-[#9d4edd]/[.08] px-4 py-3 text-right">
          <p className="text-xs text-zinc-500">사용 가능한 크레딧</p>
          <p className="text-2xl font-semibold tabular-nums text-[#e0b6ff] leading-tight">
            {creditBalance.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-zinc-500">cr</span>
          </p>
        </div>
      </div>

      {/* 하단: 크레딧으로 가능한 것 + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 border-t border-white/[.05]">
        <div className="flex items-center gap-5 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            텍스트 생성
            <strong className="text-zinc-300 font-semibold tabular-nums">{textCount}회</strong>
            가능
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
            이미지 생성
            <strong className="text-zinc-300 font-semibold tabular-nums">{imageCount}회</strong>
            가능
          </span>
        </div>
        <a
          href="#modules"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#9d4edd] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b3ecb] transition-colors"
        >
          첫 번째 생성하기
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ─── 공통 카드 컴포넌트 ────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-5 py-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
        {value}
      </p>
    </div>
  );
}

// ─── 사용자 정보 카드 ──────────────────────────────────────────────────────────

function UserCard({ me }: { me: MeResponse }) {
  return (
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        {/* 아바타 + 이름/이메일 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#9d4edd]/20 flex items-center justify-center text-base font-semibold text-[#e0b6ff]">
            {me.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-100 truncate">{me.name}</p>
            <p className="text-xs text-zinc-500 truncate">{me.email}</p>
          </div>
        </div>

        {/* 크레딧 잔액 */}
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-zinc-500">Credit Balance</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-50">
            {me.creditBalance.toLocaleString()} cr
          </p>
        </div>
      </div>

      {/* 역할 / 플랜 뱃지 */}
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
          {me.role}
        </span>
        {me.plan && (
          <span className="inline-flex items-center rounded-full bg-[#9d4edd]/15 px-2.5 py-0.5 text-xs font-medium text-[#e0b6ff]">
            {me.plan}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── 페이지 ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  let me: MeResponse;
  let modules: AiModule[] = [];
  let jobs: Job[] = [];

  // getMe() 실패는 세션 문제이므로 항상 logout 처리한다.
  // - AuthError(401): 토큰 없음/만료
  // - AuthError(404): DB에 사용자 없음 (H2 재부팅 후 stale 쿠키)
  // - 그 외 에러: 백엔드/네트워크 장애 → error boundary로 전파
  try {
    me = await getMe();
  } catch (e) {
    if (e instanceof AuthError) redirect("/login");
    throw e;
  }

  // Promise.all을 사용하지 않는다.
  // Next.js 15 Server Components에서 cookies()를 Promise.all 내부의 동시 async 호출로
  // 실행하면, 두 번째 이후 cookies() 호출이 빈 스토어를 반환하는 경합이 발생한다.
  // 이 경우 Authorization 헤더가 누락되어 401이 발생한다.
  // 순차 실행은 각 cookies() 호출이 독립적으로 request context를 읽도록 보장한다.
  modules = await getModules().catch((e) => {
    console.error("[Dashboard] getModules failed:", e);
    return [];
  });
  jobs = await getJobs().catch((e) => {
    console.error("[Dashboard] getJobs failed:", e);
    return [];
  });

  const activeModules = modules.filter((m) => m.active);
  const inactiveModules = modules.filter((m) => !m.active);
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

      {/* 사용자 정보 */}
      <UserCard me={me} />

      {/* 통계 카드 — job이 없을 때는 온보딩 배너로 대체 */}
      {jobs.length === 0 ? (
        <WelcomeBanner creditBalance={me.creditBalance} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Active Modules" value={activeModules.length} />
          <StatCard label="Total Jobs" value={jobs.length} />
          <StatCard label="Completed" value={completedJobs} />
        </div>
      )}

      {/* 모듈 섹션 */}
      <section id="modules">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-50 font-headline">Modules</h1>
          <p className="mt-1 text-sm text-zinc-500">
            프롬프트를 입력하고 Generate를 누르면 즉시 실행됩니다.
          </p>
        </div>

        {activeModules.length === 0 ? (
          <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-6 py-10 text-center">
            <p className="text-sm text-zinc-500">활성화된 모듈이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        )}

        {inactiveModules.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {inactiveModules.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 border border-white/[.07] rounded-full px-2.5 py-0.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                {m.name} · 비활성
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Job 목록 — 최신 6개 카드 */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-50 font-headline">Recent Jobs</h2>
            <p className="mt-0.5 text-sm text-zinc-500">최근 실행된 작업 내역입니다.</p>
          </div>
          <Link
            href="/jobs"
            prefetch={false}
            className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors pb-0.5"
          >
            전체 보기 →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-6 py-12 flex flex-col items-center gap-4 text-center">
            {/* 아이콘 */}
            <div className="h-11 w-11 rounded-full border border-white/[.08] bg-[#131316] flex items-center justify-center text-zinc-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            {/* 텍스트 */}
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-zinc-300">첫 번째 결과를 만들어 보세요</p>
              <p className="text-xs text-zinc-600 leading-relaxed max-w-xs">
                위 모듈 카드에서 프롬프트를 입력하고 Generate를 누르면
                결과가 여기에 바로 나타납니다.
              </p>
            </div>
            {/* 앵커 CTA */}
            <a
              href="#modules"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[.1] px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[.04] hover:border-white/[.16] transition-all"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              모듈로 이동
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs
              .slice()
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 6)
              .map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
          </div>
        )}
      </section>

      {/* 크레딧 충전 */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-50 font-headline">Credits</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Job 실행 시 모듈별 크레딧이 차감됩니다.
          </p>
        </div>
        <TopUpForm />
      </section>
    </div>
  );
}
