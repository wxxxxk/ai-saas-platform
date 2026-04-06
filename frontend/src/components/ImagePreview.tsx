"use client";

import { useState } from "react";

export default function ImagePreview({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="p-5 space-y-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          이미지를 불러올 수 없습니다. URL이 만료되었을 수 있습니다.
          <br />
          (DALL-E 생성 이미지는 약 1시간 후 만료됩니다)
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
        >
          원본 URL 열기 →
        </a>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full"
      onError={() => setFailed(true)}
    />
  );
}
