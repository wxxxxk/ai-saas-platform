import { backendFetch } from "@/lib/fetch";

export type Asset = {
  id: string;
  jobId: string;
  fileName: string;
  fileType: string;
  storageKey: string;
  fileSizeBytes: number;
  createdAt: string;
};

export type AiModule = {
  id: string;
  name: string;
  description: string | null;
  creditCostPerCall: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// JobResponse와 일치: backend job/dto/JobResponse.java
export type Job = {
  id: string;
  userId: string;
  moduleId: string;
  moduleName: string;
  status: string;
  creditUsed: number;
  inputPayload: string | null;
  outputPayload: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export async function getModules(): Promise<AiModule[]> {
  const res = await backendFetch("/api/modules");
  if (!res.ok) throw new Error(`Failed to fetch modules: ${res.status}`);
  return res.json();
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await backendFetch(`/api/jobs/${encodeURIComponent(jobId)}`);
  if (!res.ok) throw new Error(`Failed to fetch job: ${res.status}`);
  return res.json();
}

export async function getAssets(jobId: string): Promise<Asset[]> {
  const res = await backendFetch(`/api/jobs/${encodeURIComponent(jobId)}/assets`);
  if (!res.ok) throw new Error(`Failed to fetch assets: ${res.status}`);
  return res.json();
}

/** 로그인한 사용자의 Job 목록 (userId는 JWT에서 추출됨) */
export async function getJobs(): Promise<Job[]> {
  const res = await backendFetch("/api/jobs");
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

export async function getCreditBalance(): Promise<{ balance: number; lifetimeEarned: number; lifetimeUsed: number }> {
  const res = await backendFetch("/api/credits/balance");
  if (!res.ok) throw new Error(`Failed to fetch balance: ${res.status}`);
  return res.json();
}
