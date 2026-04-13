import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/**
 * 인증 토큰을 자동으로 포함하는 백엔드 fetch 래퍼.
 * next/headers의 cookies()로 auth_token 쿠키를 읽어 Authorization: Bearer 헤더로 변환한다.
 * Server Component / Server Action 양쪽에서 동일하게 사용한다.
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
