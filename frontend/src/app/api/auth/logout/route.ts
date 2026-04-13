import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * GET /api/auth/logout
 * auth_token 쿠키를 삭제하고 /login으로 리다이렉트.
 * Server Component에서 cookies().delete()가 불가능하므로
 * Route Handler를 통해 로그아웃 처리.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return NextResponse.redirect(new URL("/login", request.url));
}
