"use client";

import { useState } from "react";

export default function ImagePreview({ src }: { src: string }) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  return (
    <div className="space-y-3">
      {/* 이미지 영역 */}
      {status !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Generated image"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
          className={`w-full rounded-xl border border-white/[.08] object-contain bg-zinc-900 transition-opacity ${
            status === "loading" ? "opacity-0 h-48" : "opacity-100"
          }`}
          style={{ maxHeight: "520px" }}
        />
      )}

      {/* 로딩 스켈레톤 */}
      {status === "loading" && (
        <div className="w-full h-48 rounded-xl border border-white/[.08] bg-zinc-900 flex items-center justify-center -mt-48">
          <span className="text-xs text-zinc-600">이미지 로딩 중…</span>
        </div>
      )}

      {/* 만료 fallback */}
      {status === "error" && (
        <div className="w-full rounded-xl border border-amber-900/40 bg-amber-950/20 px-5 py-8 text-center space-y-2">
          <p className="text-sm font-medium text-amber-400">이미지를 불러올 수 없습니다</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            OpenAI DALL-E URL은 약 1시간 후 만료됩니다.
            <br />
            링크를 즉시 열어 저장하거나, 스토리지 연동 후 재생성하세요.
          </p>
        </div>
      )}

      {/* 원본 링크 */}
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        원본 URL 열기 →
      </a>
    </div>
  );
}
