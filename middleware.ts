import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware-client";

const PUBLIC_PATHS = ["/", "/docs", "/auth/login", "/auth/signup", "/auth/callback", "/auth/confirm"];
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Allow public paths + API routes except agent-facing ones
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/stripe/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon");

  if (isPublic) return supabaseResponse;

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes — only accessible to ADMIN_EMAIL
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const userEmail = user.email?.toLowerCase() ?? "";
    if (!ADMIN_EMAIL || userEmail !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
