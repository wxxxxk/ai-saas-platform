import { backendFetch } from "@/lib/fetch";

// /api/auth/me 응답 타입. 백엔드 MeResponse record와 필드명을 맞춘다.
export type MeResponse = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string | null; // 플랜 미가입 시 null
  creditBalance: number;
};

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

/**
 * 현재 로그인한 사용자 정보를 백엔드에서 가져온다.
 * backendFetch가 자동으로 auth_token 쿠키를 Authorization 헤더로 변환하여 전송한다.
 * 401이면 토큰이 없거나 만료된 것이므로 호출 측에서 로그아웃 처리가 필요하다.
 */
export async function getMe(): Promise<MeResponse> {
  const res = await backendFetch("/api/auth/me");
  if (!res.ok) throw new Error(`Failed to fetch me: ${res.status}`);
  return res.json();
}

export async function getModules(): Promise<AiModule[]> {
  const res = await backendFetch("/api/modules");
  if (!res.ok) throw new Error(`Failed to fetch modules: ${res.status}`);
  return res.json();
}

export class JobNotFoundError extends Error {
  constructor(jobId: string) {
    super(`Job not found: ${jobId}`);
    this.name = "JobNotFoundError";
  }
}

/**
 * 인증 실패(401)와 리소스 부재(404)를 명확히 구분한다.
 * JobDetailPage에서 401은 logout, 404는 not-found 페이지로 분기하기 위해 사용한다.
 */
export class JobAuthError extends Error {
  constructor(jobId: string) {
    super(`Job auth failed: ${jobId}`);
    this.name = "JobAuthError";
  }
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await backendFetch(`/api/jobs/${encodeURIComponent(jobId)}`);
  if (res.status === 404) throw new JobNotFoundError(jobId);
  if (res.status === 401) throw new JobAuthError(jobId);
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
