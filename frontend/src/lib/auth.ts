import { getCookieStore } from "@/lib/fetch";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await getCookieStore();
  return cookieStore.get("auth_token")?.value ?? null;
}

/** JWT payload를 서버에서 디코딩 (서명 검증은 백엔드에서 처리) */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return { id: decoded.sub, email: decoded.email, name: decoded.name ?? decoded.email };
  } catch {
    return null;
  }
}
