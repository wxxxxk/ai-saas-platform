"use server";

import type { Job } from "@/lib/api";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// TODO: userId는 인증 도입 후 세션에서 가져오도록 교체
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

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

  return res.json();
}
