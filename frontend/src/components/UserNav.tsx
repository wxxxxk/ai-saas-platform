"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/actions";
import type { SessionUser } from "@/lib/auth";

export default function UserNav({
  user,
  balance,
}: {
  user: SessionUser;
  balance: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          {balance} cr
        </span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{user.name}</span>
      </div>
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
      >
        {isPending ? "…" : "로그아웃"}
      </button>
    </div>
  );
}
