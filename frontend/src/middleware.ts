import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

/**
 * JWT payload의 만료 여부만 확인 (서명 검증은 backend에서).
 *
 * ⚠️ Buffer.from(str, "base64url")은 Next.js Edge Runtime에서
 * 신뢰할 수 없다. base64url 고유 문자(-,_)가 포함된 payload를
 * 잘못 디코딩해 isJwtAlive()가 false를 반환하고 유효한 쿠키를
 * 삭제하는 간헐적 로그아웃을 유발한다.
 * atob()은 Web API이므로 Edge Runtime에서 안전하게 사용 가능하다.
 */
function isJwtAlive(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    // base64url → standard base64 (replace url-safe chars, add padding)
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    if (typeof payload.exp === "number") {
      return payload.exp > Math.floor(Date.now() / 1000);
    }
    return true; // exp 없으면 만료되지 않은 것으로 간주
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get("auth_token")?.value;
  const tokenAlive = rawToken ? isJwtAlive(rawToken) : false;

  const isPublic = PUBLIC_PATHS.has(pathname);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 유효한 토큰 없음 + 보호된 경로 → 로그인으로 이동 (만료된 쿠키 삭제)
  if (!tokenAlive && !isPublic) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    if (rawToken) res.cookies.delete("auth_token");
    return res;
  }

  // 유효한 토큰 있음 + 로그인/회원가입 페이지 → 대시보드로 이동
  if (tokenAlive && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
