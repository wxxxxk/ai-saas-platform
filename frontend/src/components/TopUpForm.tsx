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
    <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] p-5 max-w-sm space-y-3">
      <p className="text-sm font-medium text-zinc-300">크레딧 충전</p>

      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(String(preset))}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium tabular-nums border transition-colors ${
              amount === String(preset)
                ? "border-[#9d4edd] bg-[#9d4edd]/20 text-[#e0b6ff]"
                : "border-white/[.12] text-zinc-400 hover:bg-white/[.06]"
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
          className="w-24 rounded-lg border border-white/[.12] bg-[#131316] px-3 py-1.5 text-sm tabular-nums text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#9d4edd]/50 transition"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#9d4edd] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#8b3ecb] disabled:opacity-50 transition-colors"
        >
          {isPending ? "충전 중…" : "충전"}
        </button>
      </form>

      {message && (
        <div
          className={`rounded-lg px-3 py-2 text-xs ${
            message.type === "success"
              ? "bg-green-950/30 border border-green-900/50 text-green-400"
              : "bg-red-950/30 border border-red-900/50 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
