export const dynamic = "force-dynamic";

/**
 * GET /api/jobs/[jobId]
 *
 * 클라이언트 컴포넌트(JobLiveView)에서 polling을 위해 호출하는 프록시 Route Handler.
 *
 * 이유:
 *  - backendFetch()는 cookies()를 사용하므로 서버 컴포넌트·Route Handler에서만 호출 가능.
 *  - 브라우저 클라이언트는 httpOnly 쿠키를 직접 읽을 수 없으므로,
 *    이 Route Handler가 쿠키를 읽어 백엔드로 인증 헤더를 포워딩한다.
 *  - balance/route.ts와 동일한 패턴을 사용한다.
 *    (Route Handler는 독립적인 요청 컨텍스트를 가지므로 getCookieStore() 캐시 없이
 *     cookies()를 직접 사용한다.)
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/jobs/${encodeURIComponent(jobId)}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
