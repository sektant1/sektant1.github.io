import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAdminSessionAuthorized } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginPath = pathname === "/admin/login" || pathname === "/api/admin/login";
  const protectedPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!protectedPath) return NextResponse.next();
  if (loginPath) return NextResponse.next();
  if (isAdminSessionAuthorized(request)) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
