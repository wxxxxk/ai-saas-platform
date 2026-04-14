import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

/**
 * GET /api/balance
 * SideNav 클라이언트 컴포넌트에서 크레딧 잔액을 조회하는 Route Handler.
 * Route Handler는 독립적인 요청 컨텍스트에서 실행되므로
 * layout + page 동시 렌더링 시의 cookies() 경합과 완전히 격리된다.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ balance: 0 }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/credits/balance`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ balance: 0 }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ balance: data.balance ?? 0 });
}
