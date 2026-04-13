import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/register"]);

/** JWT payload의 만료 여부만 확인 (서명 검증은 backend에서) */
function isJwtAlive(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );
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
