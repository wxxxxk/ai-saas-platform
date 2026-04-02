import ModuleCard from "@/components/ModuleCard";
import { getModules } from "@/lib/api";

export default async function DashboardPage() {
  const modules = await getModules();

  return (
    <div className="p-8">
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
    </div>
  );
}
