"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * /jobs/[jobId] 라우트에서 발생하는 예기치 않은 에러를 처리한다.
 * - 401 → redirect("/api/auth/logout") (page.tsx에서 처리)
 * - 404 → notFound() → not-found.tsx (page.tsx에서 처리)
 * - 그 외 (네트워크 에러, 500 등) → 이 컴포넌트
 */
export default function JobError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[JobError]", error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link
          href="/dashboard"
          prefetch={false}
          className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-6 py-10 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30 mx-auto">
          <span className="text-red-400 text-xl font-bold">!</span>
        </div>
        <h1 className="text-xl font-semibold text-zinc-100 font-headline">
          페이지를 불러올 수 없습니다
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
          작업 정보를 가져오는 중 문제가 발생했습니다.
          <br />
          잠시 후 다시 시도하거나 대시보드로 돌아가 주세요.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={reset}
            className="rounded-lg bg-zinc-700 hover:bg-zinc-600 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/dashboard"
          prefetch={false}
            className="rounded-lg border border-zinc-700 hover:bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
