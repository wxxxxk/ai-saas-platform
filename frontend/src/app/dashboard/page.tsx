import JobList from "@/components/JobList";
import ModuleCard from "@/components/ModuleCard";
import TopUpForm from "@/components/TopUpForm";
import { getJobs, getModules } from "@/lib/api";

export default async function DashboardPage() {
  const [modules, jobs] = await Promise.all([
    getModules(),
    getJobs(),
  ]);

  const activeModules = modules.filter((m) => m.active);
  const inactiveModules = modules.filter((m) => !m.active);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      {/* 모듈 섹션 */}
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Modules</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            프롬프트를 입력하고 Generate를 누르면 즉시 실행됩니다.
          </p>
        </div>

        {activeModules.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">활성화된 모듈이 없습니다.</p>
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
                className="text-xs text-zinc-400 dark:text-zinc-600 border border-black/[.06] dark:border-white/[.07] rounded-full px-2.5 py-0.5"
              >
                {m.name} · 비활성
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Job 목록 */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Recent Jobs</h2>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">{jobs.length}개</span>
        </div>
        <JobList jobs={jobs} />
      </section>

      {/* 크레딧 충전 */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Credits</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Job 실행 시 모듈별 크레딧이 차감됩니다.
          </p>
        </div>
        <TopUpForm />
      </section>
    </div>
  );
}
