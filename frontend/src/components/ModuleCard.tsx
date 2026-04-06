"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/actions";
import type { AiModule } from "@/lib/api";

const PROMPT_MODULES = new Set(["TEXT_GENERATION", "IMAGE_GENERATION"]);

const MODULE_META: Record<
  string,
  { label: string; badgeClass: string; accentClass: string; placeholder: string }
> = {
  IMAGE_GENERATION: {
    label: "Image Generation",
    badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    accentClass: "border-t-purple-400 dark:border-t-purple-500",
    placeholder: "예: A serene mountain landscape at golden hour, photorealistic",
  },
  TEXT_GENERATION: {
    label: "Text Generation",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    accentClass: "border-t-emerald-400 dark:border-t-emerald-500",
    placeholder: "예: 인공지능의 미래에 대해 짧은 글을 써줘",
  },
  SUMMARIZATION: {
    label: "Summarization",
    badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    accentClass: "border-t-orange-400 dark:border-t-orange-500",
    placeholder: "요약할 내용을 입력하세요",
  },
  TRANSLATION: {
    label: "Translation",
    badgeClass: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    accentClass: "border-t-sky-400 dark:border-t-sky-500",
    placeholder: "번역할 텍스트를 입력하세요",
  },
};

function getModuleMeta(name: string) {
  return (
    MODULE_META[name] ?? {
      label: name,
      badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      accentClass: "border-t-zinc-300 dark:border-t-zinc-600",
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
    <div
      className={`rounded-xl border border-white/[.08] border-t-2 ${meta.accentClass} bg-[#1b1b1e] p-5 flex flex-col gap-4`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badgeClass}`}>
          {meta.label}
        </span>
        <span className="shrink-0 rounded-full border border-white/[.08] px-2 py-0.5 text-xs font-medium tabular-nums text-zinc-400">
          {module.creditCostPerCall} cr
        </span>
      </div>

      {/* 설명 */}
      {module.description && (
        <p className="text-sm text-zinc-400 leading-relaxed -mt-1">
          {module.description}
        </p>
      )}

      {/* 실행 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-auto">
        {needsPrompt && (
          <>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={meta.placeholder}
              rows={3}
              required
              disabled={isPending || !module.active}
              className="w-full resize-none rounded-lg border border-white/[.1] bg-[#131316] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9d4edd]/50 disabled:opacity-50 transition"
            />
            {module.name === "IMAGE_GENERATION" && (
              <div className="rounded-lg bg-[#131316] border border-white/[.06] px-3 py-2.5 space-y-1.5">
                <p className="text-xs font-medium text-zinc-500">
                  안전한 프롬프트 예시
                </p>
                <ul className="space-y-0.5">
                  {[
                    "A serene mountain lake at sunrise, photorealistic",
                    "A cozy coffee shop interior with warm lighting",
                    "An abstract painting of ocean waves in blue tones",
                  ].map((ex) => (
                    <li key={ex} className="text-xs text-zinc-600 truncate">
                      · {ex}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-zinc-600 pt-0.5 border-t border-white/[.05]">
                  실존 인물·폭력·노골적 표현은 거절될 수 있습니다.
                </p>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={isPending || !module.active}
          className="w-full rounded-lg bg-[#9d4edd] px-4 py-2 text-sm font-medium text-white hover:bg-[#8b3ecb] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
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
        <p className="text-xs text-red-400 -mt-1">{error}</p>
      )}
    </div>
  );
}
