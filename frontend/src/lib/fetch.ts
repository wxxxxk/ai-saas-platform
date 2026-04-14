import { cache } from "react";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/**
 * React.cache로 감싼 cookies() 호출.
 * 같은 render tree 안에서 layout과 page가 동시에 backendFetch를 호출해도
 * cookies()는 한 번만 실행되고 결과가 공유된다.
 */
export const getCookieStore = cache(() => cookies());

/**
 * 인증 토큰을 자동으로 포함하는 백엔드 fetch 래퍼.
 * headers() 방식은 Next.js 16 내부 RSC reconcile 요청에서 x-auth-token이
 * 전달되지 않아 401이 발생하므로 cookies() 방식을 사용한다.
 */
export async function backendFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    console.warn(`[backendFetch] auth_token 없음 — path: ${path}`);
  }

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
