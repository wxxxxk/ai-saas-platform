export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCookieStore } from "@/lib/fetch";
import { getJobs, AuthError } from "@/lib/api";
import JobHistoryView from "@/components/JobHistoryView";

export default async function JobsPage() {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/login");

  let jobs;
  try {
    jobs = await getJobs();
  } catch (e) {
    if (e instanceof AuthError) redirect("/login");
    throw e;
  }

  // 최신순 정렬
  const sorted = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50 font-headline">히스토리</h1>
        <p className="mt-1 text-sm text-zinc-500">내가 생성한 모든 Job의 기록입니다.</p>
      </div>

      <JobHistoryView jobs={sorted} />
    </div>
  );
}
