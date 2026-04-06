"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/actions";
import type { AiModule } from "@/lib/api";

const PROMPT_MODULES = new Set(["TEXT_GENERATION", "IMAGE_GENERATION"]);

const MODULE_META: Record<string, { label: string; badgeClass: string; placeholder: string }> = {
  IMAGE_GENERATION: {
    label: "Image Generation",
    badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    placeholder: "예: A futuristic city at sunset, photorealistic",
  },
  TEXT_GENERATION: {
    label: "Text Generation",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    placeholder: "예: 인공지능의 미래에 대해 짧은 글을 써줘",
  },
  SUMMARIZATION: {
    label: "Summarization",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    placeholder: "요약할 내용을 입력하세요",
  },
  TRANSLATION: {
    label: "Translation",
    badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    placeholder: "번역할 텍스트를 입력하세요",
  },
};

function getModuleMeta(name: string) {
  return (
    MODULE_META[name] ?? {
      label: name,
      badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      placeholder: "입력값을 입력하세요",
    }
  );
}

export default function ModuleCard({ module }: { module: AiModule }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const needsPrompt = PROMPT_MODULES.has(module.name);
  const meta = getModuleMeta(module.name);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const job = await createJob(module.id, needsPrompt ? prompt : undefined);
        router.push(`/jobs/${job.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    });
  }

  return (
    <div className="rounded-xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 p-5 flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
          {meta.label}
        </span>
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 shrink-0">
          {module.creditCostPerCall} cr
        </span>
      </div>

      {/* 설명 */}
      {module.description && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed -mt-1">
          {module.description}
        </p>
      )}

      {/* 실행 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-auto">
        {needsPrompt && (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={meta.placeholder}
            rows={3}
            required
            disabled={isPending || !module.active}
            className="w-full resize-none rounded-lg border border-black/[.1] dark:border-white/[.12] bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 disabled:opacity-50 transition"
          />
        )}

        <button
          type="submit"
          disabled={isPending || !module.active}
          className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
        >
          {isPending
            ? "생성 중…"
            : !module.active
              ? "비활성"
              : needsPrompt
                ? "Generate"
                : "Run"}
        </button>
      </form>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 -mt-1">{error}</p>
      )}
    </div>
  );
}
