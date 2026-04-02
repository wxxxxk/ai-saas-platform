import JobList from "@/components/JobList";
import ModuleCard from "@/components/ModuleCard";
import { getJobs, getModules, TEMP_USER_ID } from "@/lib/api";

export default async function DashboardPage() {
  // 두 요청이 독립적이므로 Promise.all로 병렬 실행
  const [modules, jobs] = await Promise.all([
    getModules(),
    getJobs(TEMP_USER_ID),
  ]);

  return (
    <div className="p-8 space-y-10">
      {/* 모듈 섹션 */}
      <section>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
          Available Modules
        </h1>

        {modules.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No active modules found.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        )}
      </section>

      {/* Job 목록 섹션 */}
      <section>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          My Jobs
        </h2>
        <JobList jobs={jobs} />
      </section>
    </div>
  );
}
