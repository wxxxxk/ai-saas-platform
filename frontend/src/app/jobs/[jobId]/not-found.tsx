import Link from "next/link";

export default function JobNotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-white/[.08] bg-[#1b1b1e] px-6 py-10 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 text-xl mx-auto">
          ?
        </div>
        <h1 className="text-xl font-semibold text-zinc-100 font-headline">
          작업을 찾을 수 없습니다
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
          존재하지 않거나 만료된 작업입니다.
          <br />
          서버가 재시작되면 이전 작업 기록이 초기화될 수 있습니다.
          <br />
          대시보드로 돌아가 새로 생성해 주세요.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 px-4 py-2 text-sm font-medium text-zinc-100 transition-colors"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
