import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getCreditBalance } from "@/lib/api";
import UserNav from "@/components/UserNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Studio",
  description: "AI-powered generation platform",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  let balance = 0;
  if (user) {
    try {
      const wallet = await getCreditBalance();
      balance = wallet.balance;
    } catch {
      /* 미인증 페이지에서는 balance 조회 실패 가능 */
    }
  }

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="sticky top-0 z-10 border-b border-black/[.06] dark:border-white/[.07] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link
              href={user ? "/dashboard" : "/"}
              className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight"
            >
              AI Studio
            </Link>
            <nav className="flex items-center gap-6">
              {user ? (
                <UserNav user={user} balance={balance} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium rounded-lg bg-zinc-900 dark:bg-zinc-50 px-3 py-1.5 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
