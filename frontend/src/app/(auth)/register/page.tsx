"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions";

export default function RegisterPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registerAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm space-y-4">

        {/* Back to home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            홈으로
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface-low p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 font-headline">회원가입</h1>
            <p className="text-sm text-zinc-500">
              가입 즉시{" "}
              <span className="font-medium text-primary-light">100 크레딧</span>이 지급됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">이름</label>
              <input
                type="text"
                name="name"
                required
                autoComplete="name"
                placeholder="홍길동"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9d4edd]/50 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">이메일</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9d4edd]/50 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">
                비밀번호
                <span className="ml-1 font-normal text-zinc-500">(6자 이상)</span>
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#9d4edd]/50 transition"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/30 border border-red-900/50 px-3 py-2">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#9d4edd] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b3ecb] disabled:opacity-50 transition-colors"
            >
              {isPending ? "가입 중…" : "회원가입"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-zinc-700 dark:text-zinc-200 hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
