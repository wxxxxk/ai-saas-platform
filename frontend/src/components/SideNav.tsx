"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useTransition, useState } from "react";
import { logoutAction } from "@/lib/actions";
import type { SessionUser } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs",      label: "히스토리"   },
];

export default function SideNav({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [balance, setBalance] = useState<number | null>(null);

  // balance를 마운트 시 1회만 fetch한다.
  // pathname 의존성을 제거해 job detail 진입 직후 불필요한 재요청/재렌더를 방지한다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetch("/api/balance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.balance === "number") setBalance(data.balance);
      })
      .catch(() => {});
  }, []); // mount 1회

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 flex flex-col border-r border-border bg-surface-low z-20">
      {/* Brand — links to home page */}
      <div className="px-5 h-14 flex items-center justify-between border-b border-border shrink-0">
        <Link
          href="/"
          prefetch={false}
          className="text-base font-semibold text-zinc-900 dark:text-white font-headline tracking-tight hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          AI Studio
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#9d4edd]/15 text-primary-light"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-black/[.06] dark:hover:bg-white/[.06]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-border space-y-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-[#9d4edd]/20 flex items-center justify-center text-xs font-semibold text-primary-light shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 tabular-nums">
              {balance !== null ? `${balance} cr` : "…"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors disabled:opacity-50"
        >
          {isPending ? "…" : "로그아웃"}
        </button>
      </div>
    </aside>
  );
}
