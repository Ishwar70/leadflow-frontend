import { NextResponse, type NextRequest } from "next/server";

const APP_PREFIXES = ["/dashboard", "/leads", "/contacts", "/companies", "/deals", "/tasks", "/reports", "/settings", "/onboarding"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isApp = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isApp && !request.cookies.has("lf_token")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp)$).*)"],
};
