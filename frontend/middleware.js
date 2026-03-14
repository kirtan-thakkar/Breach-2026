import { NextResponse } from "next/server";

import { getDashboardRouteForRole, isRoleRouteAllowed, resolveRoleFromCookieStore } from "@/lib/auth";

function redirectToLogin(request) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const role = resolveRoleFromCookieStore(request.cookies);
  const routeForRole = getDashboardRouteForRole(role);

  if (pathname.startsWith("/dashboard/advisor") || pathname.startsWith("/dashboard/user")) {
    if (!routeForRole) {
      return redirectToLogin(request);
    }

    if (!isRoleRouteAllowed(role, pathname)) {
      const rerouteUrl = request.nextUrl.clone();
      rerouteUrl.pathname = routeForRole;
      rerouteUrl.search = "";
      return NextResponse.redirect(rerouteUrl);
    }
  }

  if ((pathname === "/login" || pathname === "/signup") && routeForRole) {
    const rerouteUrl = request.nextUrl.clone();
    rerouteUrl.pathname = routeForRole;
    rerouteUrl.search = "";
    return NextResponse.redirect(rerouteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/advisor/:path*", "/dashboard/user/:path*", "/login", "/signup"],
};
