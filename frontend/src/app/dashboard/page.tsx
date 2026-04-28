export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import JobCard from "@/components/JobCard";
import ModuleCard from "@/components/ModuleCard";
import TopUpForm from "@/components/TopUpForm";
import OnboardingBanner from "@/components/OnboardingBanner";
import QuickPromptBar from "@/components/QuickPromptBar";
import FeedGallery from "@/components/FeedGallery";
import { AuthError, getJobs, getMe, getModules, type AiModule, type Job, type MeResponse } from "@/lib/api";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-low px-5 py-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function UserCard({ me }: { me: MeResponse }) {
  return (
    <div className="rounded-xl border border-border bg-surface-low px-6 py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#9d4edd]/20 flex items-center justify-center text-base font-semibold text-primary-light">
            {me.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{me.name}</p>
            <p className="text-xs text-zinc-500 truncate">{me.email}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-zinc-500">Credit Balance</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {me.creditBalance.toLocaleString()} cr
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
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

export default async function DashboardPage() {
  let me: MeResponse;
  let modules: AiModule[] = [];
  let jobs: Job[] = [];

  try {
    me = await getMe();
  } catch (e) {
    if (e instanceof AuthError) redirect("/login");
    throw e;
  }

  // 순차 실행 — cookies() 동시 호출 시 빈 스토어 반환 경합 방지
  modules = await getModules().catch((e) => {
    console.error("[Dashboard] getModules failed:", e);
    return [];
  });
  jobs = await getJobs().catch((e) => {
    console.error("[Dashboard] getJobs failed:", e);
    return [];
  });

  const activeModules   = modules.filter((m) => m.active);
  const inactiveModules = modules.filter((m) => !m.active);
  const completedJobs   = jobs.filter((j) => j.status === "COMPLETED").length;

  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 갤러리: 완료된 job 최신 순 최대 10개
  const completedSorted = sortedJobs.filter((j) => j.status === "COMPLETED").slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">

      {/* 첫 방문 온보딩 안내 — localStorage로 1회만 표시 */}
      <OnboardingBanner />

      {/* ── HERO: Quick Prompt ── */}
      <QuickPromptBar modules={activeModules} />

      {/* ── 최근 결과 갤러리 ── */}
      {completedSorted.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 font-headline">
                Recent Creations
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">최근 생성된 결과입니다.</p>
            </div>
            <Link
              href="/jobs"
              prefetch={false}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors pb-0.5"
            >
              전체 보기 →
            </Link>
          </div>
          <FeedGallery jobs={completedSorted} />
        </section>
      )}

      {/* ── 진행 중 / 대기 중 job이 있으면 별도로 표시 ── */}
      {sortedJobs.filter((j) => j.status === "PENDING" || j.status === "RUNNING").length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 font-headline">
              In Progress
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedJobs
              .filter((j) => j.status === "PENDING" || j.status === "RUNNING")
              .slice(0, 3)
              .map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
          </div>
        </section>
      )}

      {/* ── More Tools (기존 ModuleCard) ── */}
      <section id="modules">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 font-headline">
            More Tools
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            특정 모듈에 직접 접근합니다.
          </p>
        </div>

        {activeModules.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-low px-6 py-10 text-center">
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
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 border border-border-faint rounded-full px-2.5 py-0.5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                {m.name} · 비활성
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ── 사용자 정보 + 통계 ── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UserCard me={me} />
          <div className="grid grid-cols-3 gap-4 content-start">
            <StatCard label="Active Modules" value={activeModules.length} />
            <StatCard label="Total Jobs"     value={jobs.length} />
            <StatCard label="Completed"      value={completedJobs} />
          </div>
        </div>
      </section>

      {/* ── 크레딧 충전 ── */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 font-headline">Credits</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Job 실행 시 모듈별 크레딧이 차감됩니다.
          </p>
        </div>
        <TopUpForm />
      </section>
    </div>
  );
}
