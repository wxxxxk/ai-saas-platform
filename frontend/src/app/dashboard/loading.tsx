export default function Loading() {
  return (
    <div className="p-8">
      <div className="h-8 w-40 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse mb-6" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-black/[.08] bg-white p-5 flex flex-col gap-3 dark:border-white/[.1] dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-14 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
              <div className="h-5 w-28 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            </div>
            <div className="h-5 w-36 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
            <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
