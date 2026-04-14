"use client";

import { useState } from "react";

/**
 * 이미지 URL을 fetch한 뒤 Blob URL로 변환하여 브라우저 다운로드를 트리거한다.
 * <a download> 만으로는 cross-origin 이미지가 다운로드되지 않으므로 fetch + Blob 방식 사용.
 */
export default function DownloadButton({ url }: { url: string }) {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");

  async function handleDownload() {
    setStatus("pending");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "generated-image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setStatus("idle");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  return (
    <button
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
  );
}
