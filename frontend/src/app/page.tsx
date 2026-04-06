import Link from "next/link";

const FEATURES = [
  {
    name: "Text Generation",
    desc: "GPT-4o-mini로 프롬프트 기반 텍스트를 즉시 생성합니다",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dotClass: "bg-emerald-400",
  },
  {
    name: "Image Generation",
    desc: "DALL-E 3로 프롬프트 기반 이미지를 생성합니다",
    badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    dotClass: "bg-purple-400",
  },
] as const;

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/30 blur-3xl" />
      </div>

      <div className="max-w-xl w-full text-center space-y-6">
        {/* Status pill */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Prototype · MVP
        </div>

        {/* Hero */}
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
          AI Studio
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
          텍스트와 이미지를 AI로 생성하는<br />크레딧 기반 플랫폼
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-6 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Dashboard 열기 →
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center rounded-lg border border-black/[.1] dark:border-white/[.12] px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
          >
            무료로 시작하기
          </Link>
        </div>

        {/* Feature cards */}
        <div className="pt-6 grid grid-cols-2 gap-3 text-left">
          {FEATURES.map((f) => (
            <div
              key={f.name}
              className="rounded-xl border border-black/[.07] dark:border-white/[.08] bg-white dark:bg-zinc-900 p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full shrink-0 ${f.dotClass}`} />
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${f.badgeClass}`}>
                  {f.name}
                </span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-600 pt-2">
          가입 즉시 100 크레딧이 지급됩니다
        </p>
      </div>
    </div>
  );
}
