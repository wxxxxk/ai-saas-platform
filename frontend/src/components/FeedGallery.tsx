import Link from "next/link";
import type { Job } from "@/lib/api";
import { parseOutput } from "@/lib/parseOutput";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

function ImageResultCard({ job }: { job: Job }) {
  const parsed   = parseOutput(job);
  const imageUrl = parsed?.type === "image" ? parsed.url : "";
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group relative overflow-hidden rounded-xl border border-border bg-zinc-200 dark:bg-zinc-900 aspect-square block hover:border-black/[.14] dark:hover:border-white/[.14] transition-all"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={job.inputPayload ?? "Generated image"}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-150">
        {job.inputPayload && (
          <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">
            {job.inputPayload}
          </p>
        )}
        <p className="text-[10px] text-white/50 mt-0.5">{formatDate(job.createdAt)}</p>
      </div>
    </Link>
  );
}

function TextResultCard({ job }: { job: Job }) {
  const parsed      = parseOutput(job);
  const textContent = parsed?.type === "text" ? parsed.content
                    : parsed?.type === "raw"  ? parsed.value
                    : null;
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group rounded-xl border border-border bg-surface-low p-4 space-y-2.5 block hover:border-black/[.14] dark:hover:border-white/[.14] hover:bg-surface-container transition-all"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          Text
        </span>
        <span className="text-[10px] text-zinc-500 tabular-nums">{formatDate(job.createdAt)}</span>
      </div>
      {job.inputPayload && (
        <p className="text-xs text-zinc-500 truncate">
          &ldquo;{job.inputPayload}&rdquo;
        </p>
      )}
      {textContent && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 leading-relaxed">
          {textContent}
        </p>
      )}
    </Link>
  );
}

export default function FeedGallery({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return null;

  const imageJobs = jobs.filter((j) => j.moduleName === "IMAGE_GENERATION");
  const textJobs  = jobs.filter((j) => j.moduleName !== "IMAGE_GENERATION");

  return (
    <div className="space-y-4">
      {imageJobs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageJobs.slice(0, 6).map((j) => (
            <ImageResultCard key={j.id} job={j} />
          ))}
        </div>
      )}
      {textJobs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {textJobs.slice(0, 4).map((j) => (
            <TextResultCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
