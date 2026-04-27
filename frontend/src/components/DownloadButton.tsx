"use client";

import { useState } from "react";
import { toast } from "sonner";
import Tooltip from "@/components/Tooltip";

/**
 * 이미지 저장 버튼.
 *
 * Supabase 공개 URL → fetch + Blob 다운로드 (CORS 허용)
 * OpenAI 임시 URL  → 새 탭 열기 (Azure Blob CORS 차단으로 fetch 불가)
 *
 * [주의] async function을 onClick에 직접 사용하면 React 19 + Next.js 16에서
 * async action 경로로 처리되어 "Failed to find Server Action" 에러가 발생한다.
 * → onClick은 동기 함수, 내부에서 Promise chain으로 비동기 처리.
 */

function isSupabaseUrl(url: string) {
  return url.includes("supabase.co");
}

export default function DownloadButton({ url, compact = false }: { url: string; compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");

  const isSupabase = isSupabaseUrl(url);

  function handleDownload() {
    if (isSupabase) {
      // Supabase 공개 버킷: CORS 허용 → fetch + Blob으로 실제 다운로드
      setStatus("pending");
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = "generated-image.png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
          setStatus("idle");
        })
        .catch(() => {
          setStatus("error");
          toast.error("이미지 저장에 실패했습니다. 새 탭에서 직접 저장해 주세요.");
          setTimeout(() => setStatus("idle"), 2500);
        });
    } else {
      // OpenAI 임시 URL: Azure Blob CORS 차단 → 새 탭에서 열기
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  if (isSupabase) {
    // 영구 Supabase URL: 실제 저장 버튼
    return (
      <Tooltip text={status === "error" ? "저장 실패 — 새 탭에서 저장하세요" : "이미지를 로컬에 저장"}>
        <button
          type="button"
          onClick={handleDownload}
          disabled={status === "pending"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[.08] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {status === "pending" ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-zinc-200" />
              저장 중…
            </>
          ) : status === "error" ? (
            "저장 실패"
          ) : (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              저장
            </>
          )}
        </button>
      </Tooltip>
    );
  }

  // OpenAI 임시 URL: 새 탭 열기 + 만료 안내 (compact 모드에서는 안내 텍스트 생략)
  return (
    <div className="flex items-center gap-2">
      <Tooltip text="새 탭에서 이미지 열기 (임시 URL)">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/[.1] bg-white/[.04] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/[.08] hover:text-white transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          새 탭으로 열기
        </button>
      </Tooltip>
      {!compact && (
        <span className="text-xs text-amber-500/80">임시 URL — 약 1시간 후 만료</span>
      )}
    </div>
  );
}
