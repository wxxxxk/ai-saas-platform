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
  status: string;
  creditUsed: number;
  createdAt: string;
};

// TODO: 인증 도입 후 세션에서 읽어오도록 교체
export const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function getModules(): Promise<AiModule[]> {
  const res = await fetch(`${BACKEND_URL}/api/modules`);

  if (!res.ok) {
    throw new Error(`Failed to fetch modules: ${res.status}`);
  }

  return res.json();
}

export async function getJobs(userId: string): Promise<Job[]> {
  const res = await fetch(
    `${BACKEND_URL}/api/jobs?userId=${encodeURIComponent(userId)}`
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch jobs: ${res.status}`);
  }

  return res.json();
}
