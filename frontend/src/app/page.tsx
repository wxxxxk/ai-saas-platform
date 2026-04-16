import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import HomeNav from "@/components/HomeNav";

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "프롬프트를 입력하세요",
    body: "텍스트 생성 또는 이미지 생성 모듈을 선택하고 아이디어를 입력합니다. AI가 즉시 결과를 생성합니다.",
  },
  {
    n: "02",
    title: "다시 생성하고 비교하세요",
    body: "결과가 마음에 들지 않으면 다시 생성하세요. 같은 프롬프트로 만든 변형들이 하나의 그룹으로 묶여 나란히 비교할 수 있습니다.",
  },
  {
    n: "03",
    title: "최선의 결과를 남기세요",
    body: "별표로 가장 좋은 결과를 표시해두면 히스토리에 영구 보관됩니다. 언제든 다시 꺼내 이어 작업할 수 있습니다.",
  },
] as const;

const FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: "변형 자동 그룹화",
    body: "같은 프롬프트로 만든 결과들이 하나의 아이디어 그룹으로 묶입니다. 작업이 흩어지지 않습니다.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "영구 히스토리",
    body: "모든 생성 기록이 저장됩니다. 며칠 전 작업도 프롬프트 그대로 다시 꺼내 이어갈 수 있습니다.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15M3 9h18M3 15h18" />
      </svg>
    ),
    title: "나란히 비교",
    body: "텍스트는 Split View로, 이미지는 갤러리로. 차이를 직접 눈으로 확인하며 최선을 고르세요.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: "결과 선택 & 저장",
    body: "별표로 최선의 버전을 표시해두세요. 다음 방문에도 어떤 결과를 선택했는지 바로 확인됩니다.",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  // Logged-in users go straight to their workspace.
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#131316] text-[#e4e1e6] overflow-x-hidden">
      <HomeNav />

      {/* Ambient glow — purely decorative, sits below all content */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[480px] bg-gradient-to-b from-[#9d4edd]/[.07] via-[#9d4edd]/[.02] to-transparent"
      />

      <main className="relative">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="pt-36 pb-28 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">

            {/* Status badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[.08] bg-[#1b1b1e] px-3.5 py-1.5 text-xs font-medium text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              Open Beta · 가입 즉시 100 크레딧 무료 제공
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-[4.25rem] font-semibold tracking-tight leading-[1.06] font-headline">
              <span className="text-zinc-100">좋은 결과는</span>
              <br />
              <span className="bg-gradient-to-r from-[#9d4edd] via-[#c084fc] to-[#e0b6ff] bg-clip-text text-transparent">
                처음부터
              </span>
              <br />
              <span className="text-zinc-100">나오지 않습니다.</span>
            </h1>

            {/* Supporting copy */}
            <p className="text-lg text-zinc-400 leading-relaxed max-w-xl mx-auto">
              텍스트와 이미지를 반복 생성하고, 변형들을 나란히 비교하며 최선의 결과를
              찾아가는 <strong className="text-zinc-300 font-medium">AI 워크스페이스</strong>입니다.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#9d4edd] px-7 py-3 text-sm font-semibold text-white hover:bg-[#8b3ecb] transition-colors shadow-lg shadow-[#9d4edd]/20"
              >
                무료로 시작하기
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white/[.1] px-7 py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/[.04] hover:border-white/[.16] transition-all"
              >
                로그인
              </Link>
            </div>

            <p className="text-xs text-zinc-600 pt-1">
              신용카드 없이 무료로 시작하세요 · 가입 즉시 사용 가능
            </p>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section className="py-24 px-6 border-t border-white/[.05]">
          <div className="max-w-5xl mx-auto">

            {/* Section label */}
            <div className="text-center mb-16 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-600">
                워크플로우
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight font-headline text-zinc-50">
                이렇게 작동합니다
              </h2>
            </div>

            {/* Steps */}
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">

              {/* Connecting line (desktop) */}
              <div
                aria-hidden
                className="hidden md:block absolute top-[20px] left-[calc(100%/6)] right-[calc(100%/6)] h-px bg-gradient-to-r from-transparent via-white/[.08] to-transparent"
              />

              {STEPS.map((step) => (
                <div key={step.n} className="relative space-y-4">

                  {/* Number circle */}
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[.1] bg-[#1b1b1e] text-sm font-semibold text-zinc-400 font-mono relative z-10">
                    {step.n}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-zinc-100 font-headline">
                      {step.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY DIFFERENT ────────────────────────────────────────────────── */}
        <section className="py-24 px-6 border-t border-white/[.05]">
          <div className="max-w-5xl mx-auto">

            {/* Section label + headline */}
            <div className="mb-14 space-y-3 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-600">
                왜 다른가
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight font-headline text-zinc-50">
                단순한 생성기가 아닙니다.
              </h2>
              <p className="text-base text-zinc-500 leading-relaxed">
                한 번 생성하고 잊는 도구가 아닙니다. 아이디어를 반복하고 결과를
                관리하는 워크스페이스입니다. 생성한 모든 결과가 체계적으로 쌓입니다.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-white/[.06] bg-[#1b1b1e] p-6 space-y-3 hover:border-white/[.1] hover:bg-[#1e1e22] transition-all duration-200"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#9d4edd]/10 border border-[#9d4edd]/20 text-[#c084fc]">
                    {f.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-zinc-200 font-headline">
                      {f.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {f.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Contrast note — honest, grounded */}
            <div className="mt-8 rounded-xl border border-white/[.06] bg-[#1b1b1e] px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-zinc-300">
                    현재 지원: 텍스트 생성 (OpenAI · Gemini · Claude) · 이미지 생성 (DALL·E 3)
                  </p>
                  <p className="text-xs text-zinc-600">
                    크레딧 기반 과금 · 가입 즉시 100 크레딧 제공 · 추가 모듈 순차 추가 예정
                  </p>
                </div>
                <Link
                  href="/register"
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/[.1] px-4 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/[.04] transition-colors"
                >
                  시작하기 →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ──────────────────────────────────────────────────────── */}
        <section className="py-24 px-6 border-t border-white/[.05]">
          <div className="max-w-3xl mx-auto">

            <div className="text-center mb-14 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-600">
                요금
              </p>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight font-headline text-zinc-50">
                사용한 만큼만 내세요
              </h2>
              <p className="text-base text-zinc-500 leading-relaxed max-w-md mx-auto">
                구독 없이 크레딧 단위로 사용합니다.
                가입 즉시 <strong className="text-zinc-300 font-medium">100 크레딧</strong>을 무료로 드립니다.
              </p>
            </div>

            {/* Free credit callout */}
            <div className="mb-6 rounded-xl border border-[#9d4edd]/25 bg-[#9d4edd]/[.06] px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-[#e0b6ff]">가입 시 100 크레딧 무료 제공</p>
                <p className="text-xs text-zinc-500">
                  텍스트 10회 + 이미지 3회를 바로 사용할 수 있습니다. 신용카드 불필요.
                </p>
              </div>
              <Link
                href="/register"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#9d4edd] px-4 py-2 text-xs font-semibold text-white hover:bg-[#8b3ecb] transition-colors"
              >
                무료로 시작 →
              </Link>
            </div>

            {/* Per-module costs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="rounded-xl border border-white/[.06] bg-[#1b1b1e] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900/30 border border-emerald-900/40 text-emerald-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">텍스트 생성</p>
                    <p className="text-xs text-zinc-600">OpenAI · Gemini · Claude</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold text-zinc-100 tabular-nums">10</span>
                  <span className="text-sm text-zinc-500">크레딧 / 회</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  원하는 AI 공급자를 직접 선택해 생성할 수 있습니다.
                </p>
              </div>

              <div className="rounded-xl border border-white/[.06] bg-[#1b1b1e] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-900/30 border border-purple-900/40 text-purple-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">이미지 생성</p>
                    <p className="text-xs text-zinc-600">DALL·E 3 (OpenAI)</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold text-zinc-100 tabular-nums">30</span>
                  <span className="text-sm text-zinc-500">크레딧 / 회</span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  1024×1024 HD 이미지를 즉시 생성합니다. 결과는 영구 보관됩니다.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
        <section className="py-24 px-6 border-t border-white/[.05]">
          <div className="max-w-2xl mx-auto text-center space-y-8">

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight font-headline text-zinc-50">
                지금 시작하세요
              </h2>
              <p className="text-base text-zinc-400 leading-relaxed">
                가입 즉시 100 크레딧이 제공됩니다.
                <br />
                신용카드 없이, 지금 바로 첫 번째 결과를 만들어 보세요.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#9d4edd] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#8b3ecb] transition-colors shadow-lg shadow-[#9d4edd]/20"
              >
                계정 만들기
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white/[.1] px-8 py-3.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[.04] hover:border-white/[.16] transition-all"
              >
                이미 계정이 있으신가요? 로그인
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[.05] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-semibold text-zinc-500 font-headline tracking-tight">
            AI Studio
          </span>
          <p className="text-xs text-zinc-700 text-center sm:text-right">
            텍스트 &amp; 이미지 AI 워크스페이스 · © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
