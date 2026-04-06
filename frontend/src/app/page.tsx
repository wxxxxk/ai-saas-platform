import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-6">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400">
          Prototype · MVP
        </div>

        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Studio
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
          텍스트와 이미지를 AI로 생성하는 플랫폼.
          <br />
          프롬프트를 입력하고 결과를 바로 확인하세요.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 px-6 py-2.5 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Dashboard 열기
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="pt-8 grid grid-cols-2 gap-3 text-left">
          {[
            {
              name: "Text Generation",
              desc: "프롬프트로 텍스트를 생성합니다",
              badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
            },
            {
              name: "Image Generation",
              desc: "DALL-E로 이미지를 생성합니다",
              badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
            },
          ].map((m) => (
            <div
              key={m.name}
              className="rounded-xl border border-black/[.07] dark:border-white/[.08] bg-white dark:bg-zinc-900 p-4 space-y-2"
            >
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${m.badge}`}>
                {m.name}
              </span>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
