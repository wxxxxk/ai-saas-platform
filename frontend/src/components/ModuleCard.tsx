"use client";

import { useTransition, useState } from "react";
import { createJob } from "@/lib/actions";
import type { AiModule } from "@/lib/api";

type JobResult =
  | { ok: true; jobId: string }
  | { ok: false; message: string };

export default function ModuleCard({ module }: { module: AiModule }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<JobResult | null>(null);

  function handleRun() {
    setResult(null);
    startTransition(async () => {
      try {
        const job = await createJob(module.id);
        setResult({ ok: true, jobId: job.id });
      } catch (e) {
        setResult({
          ok: false,
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    });
  }

  return (
    <div className="rounded-xl border border-black/[.08] bg-white p-5 flex flex-col gap-3 dark:border-white/[.1] dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {module.active ? "Active" : "Inactive"}
        </span>
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {module.creditCostPerCall} credits / call
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {module.name}
        </h3>
        {module.description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {module.description}
          </p>
        )}
      </div>

      <button
        onClick={handleRun}
        disabled={isPending || !module.active}
        className="mt-1 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? "Creating job…" : "Run"}
      </button>

      {result && (
        <p
          className={`text-xs ${
            result.ok
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {result.ok ? `Job created: ${result.jobId}` : `Error: ${result.message}`}
        </p>
      )}
    </div>
  );
}
