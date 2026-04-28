"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createJob } from "@/lib/actions";
import type { AiModule } from "@/lib/api";

const IMAGE_KEYWORDS = [
  "image", "photo", "render", "picture", "illustration",
  "drawing", "artwork", "visual", "photograph", "cinematic",
  "portrait", "landscape", "wallpaper", "realistic", "3d",
];

const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: "OpenAI",
  GEMINI: "Gemini",
  CLAUDE: "Claude",
  STABILITY_AI: "Stability",
};

const EXAMPLE_PROMPTS = [
  "A cinematic futuristic city at sunset, ultra detailed",
  "AI 서비스 소개글을 전문적인 톤으로 작성해줘",
  "스타트업 랜딩페이지 카피라이팅 작성해줘",
  "Minimal luxury product photo on dark background",
];

function detectModuleName(prompt: string): "IMAGE_GENERATION" | "TEXT_GENERATION" {
  const lower = prompt.toLowerCase();
  return IMAGE_KEYWORDS.some((kw) => lower.includes(kw))
    ? "IMAGE_GENERATION"
    : "TEXT_GENERATION";
}

export default function QuickPromptBar({ modules }: { modules: AiModule[] }) {
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<string | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectedName = detectModuleName(prompt);
  const targetModule =
    modules.find((m) => m.name === detectedName && m.active) ??
    modules.find((m) => m.active);

  const supportedProviders = targetModule?.supportedProviders ?? [];
  const validProvider = supportedProviders.includes(provider ?? "") ? provider : undefined;

  const isImage = detectedName === "IMAGE_GENERATION";
  const moduleBadge = isImage && modules.some((m) => m.name === "IMAGE_GENERATION" && m.active)
    ? { label: "Image", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" }
    : { label: "Text",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("프롬프트를 입력해 주세요.");
      return;
    }
    if (!targetModule) {
      setError("활성화된 모듈이 없습니다.");
      return;
    }
    setError(null);
    setIsPending(true);
    try {
      const jobId = await createJob(targetModule.id, prompt.trim(), validProvider);
      window.location.assign(`/jobs/${jobId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "작업 생성에 실패했습니다.";
      setError(msg);
      toast.error(msg);
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-low p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 font-headline">
          무엇을 만들고 싶으세요?
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          텍스트와 이미지를 자동으로 감지해 생성합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (error) setError(null);
          }}
          placeholder={"A cinematic futuristic city at sunset...\nAI 서비스 소개글을 작성해줘"}
          rows={4}
          disabled={isPending}
          className={`w-full resize-none rounded-xl border bg-surface px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors ${
            error
              ? "border-red-500/50 focus:ring-red-500/30"
              : "border-border focus:ring-[#9d4edd]/40"
          }`}
        />

        {/* Quick-fill example prompts */}
        {!isPending && (
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setPrompt(ex); setError(null); }}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/[.04] dark:hover:bg-white/[.04] hover:border-black/[.12] dark:hover:border-white/[.12] transition-all"
              >
                <span className="text-zinc-400">↗</span>
                {ex.length > 30 ? ex.slice(0, 30) + "…" : ex}
              </button>
            ))}
          </div>
        )}

        {/* Provider selector */}
        {supportedProviders.length > 1 && !isPending && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Provider</span>
            <div className="flex gap-1">
              {supportedProviders.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(provider === p ? undefined : p)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    provider === p
                      ? "bg-[#9d4edd]/20 text-primary-light border border-[#9d4edd]/40"
                      : "bg-surface text-zinc-500 border border-border-faint hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {PROVIDER_LABELS[p] ?? p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-2 min-h-[1.5rem]">
            {prompt.trim() && (
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${moduleBadge.cls}`}>
                {moduleBadge.label}
              </span>
            )}
            {targetModule && prompt.trim() && (
              <span className="text-xs text-zinc-500 tabular-nums">
                {targetModule.creditCostPerCall} cr 차감
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending || !targetModule}
            className="inline-flex items-center gap-2 rounded-xl bg-[#9d4edd] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#8b3ecb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                생성 중…
              </>
            ) : (
              <>
                Generate
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
