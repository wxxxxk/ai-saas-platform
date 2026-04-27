"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createJob } from "@/lib/actions";
import type { AiModule } from "@/lib/api";
import Tooltip from "@/components/Tooltip";

const PROMPT_MODULES = new Set(["TEXT_GENERATION", "IMAGE_GENERATION"]);

// 알려진 공급자 이름의 표시용 레이블. 새 공급자는 이 맵에만 추가하면 된다.
const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: "OpenAI",
  GEMINI: "Gemini",
  CLAUDE: "Claude",
  STABILITY_AI: "Stability",
};

const EXAMPLE_PROMPTS: Record<string, string[]> = {
  TEXT_GENERATION: [
    "AI 서비스의 미래를 5문단으로 설명해줘",
    "스타트업 랜딩페이지 문구를 작성해줘",
    "제품 소개글을 전문적인 톤으로 작성해줘",
  ],
  IMAGE_GENERATION: [
    "A cinematic futuristic city at sunset, ultra detailed",
    "A cute robot assistant in a cozy workspace, 3D render",
    "Minimal luxury product photo on dark background",
  ],
};

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
  const [isPending, setIsPending] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | undefined>(undefined);

  const needsPrompt = PROMPT_MODULES.has(module.name);
  const meta = getModuleMeta(module.name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 브라우저 네이티브 required 대신 인라인 에러로 처리한다.
    if (needsPrompt && !prompt.trim()) {
      setError("프롬프트를 입력해 주세요.");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      // createJob은 jobId를 반환한다 (redirect 미사용).
      // startTransition + Server Action redirect() 조합은 post-action router.refresh()가
      // /dashboard RSC를 재요청하면서 navigation과 경합해 dashboard로 되돌아오는 문제가 있다.
      // window.location.assign()으로 hard navigation하면 router cache를 완전히 우회한다.
      const jobId = await createJob(module.id, needsPrompt ? prompt.trim() : undefined, provider);
      window.location.assign(`/jobs/${jobId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "작업 생성에 실패했습니다.";
      setError(msg);
      toast.error(msg);
      setIsPending(false);
    }
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
            <div className="space-y-1">
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={meta.placeholder}
                rows={3}
                disabled={isPending || !module.active}
                className={`w-full resize-none rounded-lg border bg-[#131316] px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 disabled:opacity-50 transition ${
                  error && !isPending
                    ? "border-red-800/60 focus:ring-red-700/40"
                    : "border-white/[.1] focus:ring-[#9d4edd]/50"
                }`}
              />
              {/* 글자 수 카운터 — 입력 내용이 있을 때만 표시 */}
              {prompt.length > 0 && !isPending && (
                <p className="text-right text-[10px] tabular-nums text-zinc-700">
                  {prompt.length} 자
                </p>
              )}
            </div>
            {EXAMPLE_PROMPTS[module.name] && !isPending && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-0.5">
                  예시 프롬프트
                </p>
                <div className="flex flex-col gap-0.5">
                  {EXAMPLE_PROMPTS[module.name].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => { setPrompt(ex); setError(null); }}
                      className="text-left text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/[.05] rounded-md px-2.5 py-1.5 transition-colors leading-relaxed"
                    >
                      <span className="text-zinc-700 mr-1.5">↗</span>
                      {ex}
                    </button>
                  ))}
                </div>
                {module.name === "IMAGE_GENERATION" && (
                  <p className="text-[10px] text-zinc-700 px-2.5 pt-1">
                    실존 인물·폭력·노골적 표현은 거절될 수 있습니다.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {module.supportedProviders.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Provider</span>
            <div className="flex gap-1">
              {module.supportedProviders.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isPending || !module.active}
                  onClick={() => setProvider(provider === p ? undefined : p)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                    provider === p
                      ? "bg-[#9d4edd]/20 text-[#e0b6ff] border border-[#9d4edd]/40"
                      : "bg-[#131316] text-zinc-500 border border-white/[.07] hover:text-zinc-300"
                  }`}
                >
                  {PROVIDER_LABELS[p] ?? p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Tooltip
            text={!module.active ? "비활성 모듈" : needsPrompt ? "AI로 콘텐츠 생성" : "모듈 실행"}
            block
          >
          <button
            type="submit"
            disabled={isPending || !module.active}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#9d4edd] px-4 py-2 text-sm font-medium text-white hover:bg-[#8b3ecb] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            {isPending ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                처리 중…
              </>
            ) : !module.active ? (
              "비활성"
            ) : needsPrompt ? (
              "Generate"
            ) : (
              "Run"
            )}
          </button>
          </Tooltip>

          {/* 크레딧 소모 안내 — 활성 상태이고 대기 중이 아닐 때 */}
          {module.active && !isPending && (
            <p className="text-center text-[10px] tabular-nums text-zinc-700">
              생성 시 {module.creditCostPerCall} cr 차감
            </p>
          )}

          {/* 대기 중 안내 — 실제 발생하는 일(job 생성 요청)을 정확하게 안내 */}
          {isPending && (
            <p className="text-center text-[10px] text-zinc-500 animate-pulse">
              잠시 후 결과 페이지로 이동합니다…
            </p>
          )}
        </div>
      </form>

      {error && (
        <p className="text-xs text-red-400 -mt-1">{error}</p>
      )}
    </div>
  );
}
