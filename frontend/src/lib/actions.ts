"use server";

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

  return res.json();
}
