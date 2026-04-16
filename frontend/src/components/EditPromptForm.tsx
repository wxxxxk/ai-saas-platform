"use client";

import { useState, useTransition } from "react";
import { createJob } from "@/lib/actions";

const PROVIDER_LABELS: Record<string, string> = {
  OPENAI:       "OpenAI",
  GEMINI:       "Gemini",
  CLAUDE:       "Claude",
  STABILITY_AI: "Stability AI",
};

interface Props {
  moduleId: string;
  initialPrompt: string;
  creditCost: number;
  /**
   * 현재 결과를 만든 공급자. 전달하면 재생성 시 동일 공급자가 사용되고
   * 인포 행에 공급자 이름이 표시된다. 미전달 시 모듈 기본 공급자를 사용한다.
   */
  defaultProvider?: string;
}

/**
 * 기존 프롬프트를 수정해 새 Job을 생성하는 폼.
 *
 * - 프롬프트 변경 여부에 따라 버튼 레이블을 동적으로 바꿔
 *   "재생성" vs "수정된 내용으로 생성"을 명확히 구분한다.
 * - 새 Job이 생성되면 window.location.assign()으로 해당 detail 페이지로 이동한다.
 * - "초기화" 버튼으로 원본 프롬프트로 되돌릴 수 있다.
 * - defaultProvider를 전달하면 재생성 시 같은 공급자가 유지된다.
 */
export default function EditPromptForm({
  moduleId,
  initialPrompt,
  creditCost,
  defaultProvider,
}: Props) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const trimmedPrompt = prompt.trim();
  const isDirty       = trimmedPrompt !== initialPrompt.trim();
  const isEmpty       = trimmedPrompt.length === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEmpty) return;

    setError(null);
    startTransition(async () => {
      try {
        // defaultProvider를 전달해 현재 결과와 동일한 공급자로 재생성한다.
        const jobId = await createJob(moduleId, trimmedPrompt, defaultProvider);
        window.location.assign(`/jobs/${jobId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "생성에 실패했습니다.");
      }
    });
  }

  const providerLabel = defaultProvider
    ? (PROVIDER_LABELS[defaultProvider] ?? defaultProvider)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 프롬프트 편집 영역 */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          disabled={isPending}
          className="w-full resize-none rounded-lg border border-white/[.1] bg-[#131316] px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9d4edd]/40 disabled:opacity-50 transition leading-relaxed"
        />
        {isDirty && (
          <button
            type="button"
            onClick={() => setPrompt(initialPrompt)}
            className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-xs text-zinc-600 hover:text-zinc-400 hover:bg-white/[.05] transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* 하단: 크레딧 + 공급자 정보 + 제출 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-700 tabular-nums">
          {creditCost} cr
          {providerLabel && (
            <span className="ml-1.5 text-zinc-700">· {providerLabel}</span>
          )}
        </span>
        <button
          type="submit"
          disabled={isPending || isEmpty}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#9d4edd] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b3ecb] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {isPending ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white shrink-0" />
              생성 중…
            </>
          ) : isDirty ? (
            "수정된 내용으로 생성"
          ) : (
            "재생성하기"
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 leading-relaxed">{error}</p>
      )}
    </form>
  );
}
