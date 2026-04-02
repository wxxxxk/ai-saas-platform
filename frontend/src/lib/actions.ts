"use server";

import { refresh } from "next/cache";
import type { Job } from "@/lib/api";
import { TEMP_USER_ID } from "@/lib/api";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function createJob(moduleId: string): Promise<Job> {
  const res = await fetch(`${BACKEND_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: TEMP_USER_ID,
      moduleId,
      inputPayload: "",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create job: ${res.status} ${text}`);
  }

  const job: Job = await res.json();

  // Job 생성 후 클라이언트 라우터에 현재 페이지 재요청 신호를 보낸다.
  // DashboardPage(Server Component)가 다시 실행되어 Job 목록이 자동 갱신된다.
  refresh();

  return job;
}
