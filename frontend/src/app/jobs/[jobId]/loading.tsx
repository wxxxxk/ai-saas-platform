export default function JobDetailLoading() {
  return (
    <div className="p-8 max-w-2xl animate-pulse">
      <div className="mb-6 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mb-6 h-8 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="rounded-xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-950 px-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="py-4 border-b border-black/[.06] dark:border-white/[.08] last:border-0 flex flex-col gap-2">
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-900" />
          </div>
        ))}
      </div>
    </div>
  );
}
