"use client";

import { useState, useTransition } from "react";
import { topUpAction } from "@/lib/actions";

const PRESETS = [100, 500, 1000];

export default function TopUpForm() {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("100");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(amount, 10);
    if (!n || n < 1) return;
    setMessage(null);

    startTransition(async () => {
      const result = await topUpAction(n);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `${n} 크레딧이 충전되었습니다. 현재 잔액: ${result.balance} cr` });
      }
    });
  }

  return (
    <div className="rounded-xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 p-5 max-w-sm">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">크레딧 충전</p>

      <div className="flex gap-2 mb-3">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(String(preset))}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
              amount === String(preset)
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-black/[.12] dark:border-white/[.15] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            +{preset}
          </button>
        ))}
      </div>

      <form onSubmit={handleTopUp} className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          max={10000}
          className="w-24 rounded-lg border border-black/[.12] dark:border-white/[.15] bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-1.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {isPending ? "충전 중…" : "충전"}
        </button>
      </form>

      {message && (
        <p className={`mt-2 text-xs ${message.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
