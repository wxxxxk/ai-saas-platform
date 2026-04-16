"use client";

import { useState } from "react";

interface Props {
  text: string;
  /** className을 전달하면 기본 스타일 대신 해당 클래스가 적용된다. */
  className?: string;
}

export default function CopyButton({ text, className }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        "shrink-0 rounded-lg border border-white/[.08] bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 transition-colors"
      }
    >
      {copied ? "✓ 복사됨" : "복사"}
    </button>
  );
}
