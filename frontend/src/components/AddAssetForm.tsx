"use client";

import { useState, useTransition } from "react";
import { createAsset } from "@/lib/actions";

export default function AddAssetForm({ jobId }: { jobId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSizeBytes, setFileSizeBytes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const size = Number(fileSizeBytes);
    if (!fileName || !fileType || !size) return;

    startTransition(async () => {
      try {
        await createAsset(jobId, fileName, fileType, size);
        setFileName("");
        setFileType("");
        setFileSizeBytes("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          File Name
        </label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="report.pdf"
          required
          className="rounded-lg border border-black/[.12] dark:border-white/[.15] bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          File Type
        </label>
        <input
          type="text"
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          placeholder="application/pdf"
          required
          className="rounded-lg border border-black/[.12] dark:border-white/[.15] bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Size (bytes)
        </label>
        <input
          type="number"
          value={fileSizeBytes}
          onChange={(e) => setFileSizeBytes(e.target.value)}
          placeholder="1024"
          min={1}
          required
          className="w-32 rounded-lg border border-black/[.12] dark:border-white/[.15] bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-50 transition-colors"
      >
        {isPending ? "추가 중…" : "Asset 추가"}
      </button>

      {error && (
        <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </form>
  );
}
