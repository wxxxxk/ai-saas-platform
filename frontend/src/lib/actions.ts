"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { backendFetch } from "@/lib/fetch";
import type { Asset, Job } from "@/lib/api";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

// ─── 인증 ──────────────────────────────────────────────────────────────────────

export async function loginAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const data = await res.json();
  const cookieStore = await cookies();
  cookieStore.set("auth_token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  redirect("/dashboard");
}

export async function registerAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body.error ?? "회원가입에 실패했습니다." };
  }

  const data = await res.json();
  const cookieStore = await cookies();
  cookieStore.set("auth_token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

// ─── Job ───────────────────────────────────────────────────────────────────────

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body.error) return body.error;
    if (body.message) return body.message;
  } catch { /* ignore */ }
  return `${fallback} (${res.status})`;
}

export async function createJob(moduleId: string, inputPayload?: string): Promise<Job> {
  const res = await backendFetch("/api/jobs", {
    method: "POST",
    body: JSON.stringify({ moduleId, inputPayload: inputPayload ?? "" }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Job 생성에 실패했습니다"));
  }

  const job: Job = await res.json();
  refresh();
  return job;
}

export async function createAsset(
  jobId: string,
  fileName: string,
  fileType: string,
  fileSizeBytes: number
): Promise<Asset> {
  const res = await backendFetch(`/api/jobs/${jobId}/assets`, {
    method: "POST",
    body: JSON.stringify({ fileName, fileType, fileSizeBytes }),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Asset 생성에 실패했습니다"));
  }

  const asset: Asset = await res.json();
  refresh();
  return asset;
}

async function postJobTransition(jobId: string, action: string, body?: object): Promise<Job> {
  const res = await backendFetch(`/api/jobs/${jobId}/${action}`, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, `Job ${action} 처리에 실패했습니다`));
  }

  const job: Job = await res.json();
  refresh();
  return job;
}

export async function startJob(jobId: string): Promise<Job> {
  return postJobTransition(jobId, "start");
}

export async function completeJob(jobId: string, outputPayload?: string): Promise<Job> {
  return postJobTransition(jobId, "complete", { outputPayload: outputPayload ?? null });
}

export async function failJob(jobId: string, errorMessage?: string): Promise<Job> {
  return postJobTransition(jobId, "fail", { errorMessage: errorMessage ?? null });
}

export async function cancelJob(jobId: string): Promise<Job> {
  return postJobTransition(jobId, "cancel");
}

// ─── 크레딧 ────────────────────────────────────────────────────────────────────

export async function topUpAction(amount: number): Promise<{ error?: string; balance?: number }> {
  const res = await backendFetch("/api/credits/top-up", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });

  if (!res.ok) return { error: "크레딧 충전에 실패했습니다." };

  const data = await res.json();
  refresh();
  return { balance: data.balance };
}
