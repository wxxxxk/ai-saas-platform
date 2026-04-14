"use client";

import { useState } from "react";
import { createJob } from "@/lib/actions";

interface Props {
  moduleId: string;
  prompt: string;
  creditCost: number;
}

/**
 * 같은 모듈 + 같은 프롬프트로 새 Job을 생성한다.
 * createJob()이 jobId를 반환하면 window.location.assign()으로 새 Job 상세 페이지로 이동.
 */
export default function RegenerateButton({ moduleId, prompt, creditCost }: Props) {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleRegenerate() {
    setStatus("pending");
    setErrorMsg(null);
    try {
      const jobId = await createJob(moduleId, prompt);
      window.location.assign(`/jobs/${jobId}`);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "재생성에 실패했습니다.");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleRegenerate}
        disabled={status === "pending"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#9d4edd]/40 bg-[#9d4edd]/10 px-3 py-1.5 text-xs font-medium text-[#e0b6ff] hover:bg-[#9d4edd]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {status === "pending" ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border border-purple-500 border-t-purple-200" />
            생성 중…
          </>
        ) : (
          <>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            재생성 ({creditCost} cr)
          </>
        )}
      </button>

      {errorMsg && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
