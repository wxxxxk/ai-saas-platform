import Link from "next/link";
import { getAssets, getJob } from "@/lib/api";
import type { Asset } from "@/lib/api";
import AddAssetForm from "@/components/AddAssetForm";

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  RUNNING:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  FAILED:    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-4 border-b border-black/[.06] dark:border-white/[.08] last:border-0">
      <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm text-zinc-800 dark:text-zinc-200 break-all">{value}</dd>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetList({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        연결된 Asset이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-black/[.08] dark:border-white/[.1]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/[.08] bg-zinc-50 text-left text-xs font-medium text-zinc-500 dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-400">
            <th className="px-4 py-3">File Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Created At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[.04] bg-white dark:divide-white/[.06] dark:bg-zinc-950">
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
              <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                {asset.fileName}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {asset.fileType}
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                {formatBytes(asset.fileSizeBytes)}
              </td>
              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                {new Date(asset.createdAt).toLocaleString("ko-KR", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const [job, assets] = await Promise.all([getJob(jobId), getAssets(jobId)]);

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100"
        >
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        Job Detail
      </h1>

      <div className="rounded-xl border border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-950 px-6">
        <dl>
          <Row label="Job ID" value={<span className="font-mono">{job.id}</span>} />
          <Row
            label="Status"
            value={
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[job.status] ?? STATUS_STYLES.PENDING
                }`}
              >
                {job.status}
              </span>
            }
          />
          <Row label="Credits Used" value={job.creditUsed} />
          <Row label="User ID" value={<span className="font-mono">{job.userId}</span>} />
          <Row label="Module ID" value={<span className="font-mono">{job.moduleId}</span>} />
          <Row
            label="Input Payload"
            value={
              job.inputPayload ? (
                <span className="font-mono">{job.inputPayload}</span>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-600 italic">없음</span>
              )
            }
          />
          <Row
            label="Created At"
            value={new Date(job.createdAt).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          />
        </dl>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Assets
        </h2>
        <AddAssetForm jobId={jobId} />
        <AssetList assets={assets} />
      </section>
    </div>
  );
}
