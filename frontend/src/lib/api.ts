export type AiModule = {
  id: string;
  name: string;
  description: string | null;
  creditCostPerCall: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Job = {
  id: string;
  status: string;
  inputPayload: string | null;
  outputPayload: string | null;
  errorMessage: string | null;
  creditUsed: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function getModules(): Promise<AiModule[]> {
  const res = await fetch(`${BACKEND_URL}/api/modules`);

  if (!res.ok) {
    throw new Error(`Failed to fetch modules: ${res.status}`);
  }

  return res.json();
}
