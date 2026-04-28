"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "onboarding_v1_dismissed";

export default function OnboardingBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-[#9d4edd]/25 bg-[#9d4edd]/[.06] px-5 py-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-[#9d4edd]/15 flex items-center justify-center">
          <svg className="h-3.5 w-3.5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">시작하는 방법</p>
          <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed max-w-lg">
            아래 <strong className="text-zinc-600 dark:text-zinc-400 font-medium">모듈 카드</strong>에서 프롬프트를 입력하고{" "}
            <strong className="text-zinc-600 dark:text-zinc-400 font-medium">Generate</strong>를 누르면 AI 결과가 즉시 생성됩니다.
            결과는 <strong className="text-zinc-600 dark:text-zinc-400 font-medium">히스토리</strong>에서 언제든 다시 확인할 수 있습니다.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="닫기"
        className="shrink-0 mt-0.5 rounded-md p-1 text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-black/[.06] dark:hover:bg-white/[.06] transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
