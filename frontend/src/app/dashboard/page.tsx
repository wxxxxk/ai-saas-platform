import JobList from "@/components/JobList";
import ModuleCard from "@/components/ModuleCard";
import TopUpForm from "@/components/TopUpForm";
import { getJobs, getModules } from "@/lib/api";

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

export default async function DashboardPage() {
  const [modules, jobs] = await Promise.all([getModules(), getJobs()]);

  const activeModules = modules.filter((m) => m.active);
  const inactiveModules = modules.filter((m) => !m.active);
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
      {/* Stats overview */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Modules" value={activeModules.length} />
        <StatCard label="Total Jobs" value={jobs.length} />
        <StatCard label="Completed" value={completedJobs} />
      </div>

      {/* 모듈 섹션 */}
      <section>
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

      {/* Job 목록 */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-50 font-headline">Recent Jobs</h2>
            <p className="mt-0.5 text-sm text-zinc-500">최근 실행된 작업 내역입니다.</p>
          </div>
          <span className="text-sm tabular-nums text-zinc-500 pb-0.5">
            {jobs.length}개
          </span>
        </div>
        <JobList jobs={jobs} />
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
