"use client";

import { useState, useTransition } from "react";
import { cancelJob, completeJob, failJob, startJob } from "@/lib/actions";

type ButtonConfig = {
  label: string;
  action: () => Promise<unknown>;
  variant: "primary" | "danger" | "ghost";
};

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "CANCELLED"]);

export default function JobStatusActions({
  jobId,
  status,
}: {
  jobId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (TERMINAL_STATUSES.has(status)) return null;

  const buttons: ButtonConfig[] =
    status === "PENDING"
      ? [
          { label: "Start", action: () => startJob(jobId), variant: "primary" },
          { label: "Cancel", action: () => cancelJob(jobId), variant: "ghost" },
        ]
      : /* RUNNING */
        [
          { label: "Complete", action: () => completeJob(jobId), variant: "primary" },
          { label: "Fail", action: () => failJob(jobId), variant: "danger" },
          { label: "Cancel", action: () => cancelJob(jobId), variant: "ghost" },
        ];

  function handleClick(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  }

  const variantClass: Record<ButtonConfig["variant"], string> = {
    primary:
      "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
    danger:
      "bg-red-600 text-white hover:bg-red-500",
    ghost:
      "border border-black/[.12] dark:border-white/[.15] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800",
  };

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex gap-2">
        {buttons.map(({ label, action, variant }) => (
          <button
            key={label}
            disabled={isPending}
            onClick={() => handleClick(action)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${variantClass[variant]}`}
          >
            {isPending ? "…" : label}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
