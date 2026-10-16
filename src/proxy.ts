import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// src/proxy.ts — runs on every request before the route handler.
//
// Currently rate-limits:
//   - POST /api/auth/callbacks/credentials (the NextAuth credentials
//     provider's endpoint) to 10 attempts per minute per IP. This is the
//     effective brute-force protection for the login flow.
//
// All other routes pass through unaffected.

export async function proxy(req: NextRequest) {
  // Only rate-limit the NextAuth credentials callback.
  if (req.method === "POST" && req.nextUrl.pathname === "/api/auth/callbacks/credentials") {
    const fwd = req.headers.get("x-forwarded-for");
    const ip = fwd ? fwd.split(",")[0].trim() : "anon";
    const rl = rateLimit({
      key: `login:${ip}`,
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Try again in a minute.",
          resetAt: rl.resetAt,
        },
        { status: 429 }
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  // Only run the middleware on API auth routes (avoids paying the
  // middleware tax on every static asset + page render).
  matcher: ["/api/auth/:path*"],
};
