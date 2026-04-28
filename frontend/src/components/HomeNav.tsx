import Link from "next/link";

/**
 * HomeNav — fixed top navigation for the logged-out home page.
 *
 * This component is intentionally a Server Component (no "use client"):
 * it has no interactive state and renders faster as RSC.
 *
 * Only shown on the home page (landing experience).
 * Logged-in users are redirected to /dashboard before this renders.
 */
export default function HomeNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">

        {/* Brand */}
        <Link
          href="/"
          className="text-base font-semibold text-zinc-900 dark:text-zinc-100 font-headline tracking-tight hover:text-zinc-700 dark:hover:text-white transition-colors"
        >
          AI Studio
        </Link>

        {/* Auth CTAs */}
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-black/[.05] dark:hover:bg-white/[.05] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#9d4edd] text-white hover:bg-[#8b3ecb] transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
