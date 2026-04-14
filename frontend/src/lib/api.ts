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
 * 인증 실패를 나타내는 타입 에러.
 * - 401: JWT 없음 / 만료 / 서명 불일치
 * - 404: JWT는 유효하지만 DB에 사용자가 없음 (H2 재부팅 후 stale 쿠키)
 * 호출 측에서 이 에러를 받으면 로그아웃 처리한다.
 */
export class AuthError extends Error {
  constructor(public readonly status: number) {
    super(`Auth failed: ${status}`);
    this.name = "AuthError";
  }
}

/**
 * 현재 로그인한 사용자 정보를 백엔드에서 가져온다.
 * - 401: 토큰 없음/만료 → AuthError
 * - 404: DB에 사용자 없음(stale 쿠키) → AuthError
 * - 기타 에러: 일반 Error (재throw해서 error boundary로)
 */
export async function getMe(): Promise<MeResponse> {
  const res = await backendFetch("/api/auth/me");
  if (res.status === 401 || res.status === 404) throw new AuthError(res.status);
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
