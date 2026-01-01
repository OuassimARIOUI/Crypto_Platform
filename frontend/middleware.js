import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/auth/action",
  "/reset-password",
  "/verify-email",
];

const ROLE_GATES = [
  { prefix: "/users", roles: ["admin", "moderator"] },
  { prefix: "/reports", roles: ["admin"] },
];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isStaticAsset(pathname) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$/.test(pathname);
}

async function fetchMe({ apiBase, token }) {
  const res = await fetch(`${apiBase}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return { ok: false, status: res.status };

  const data = await res.json().catch(() => null);
  if (!data || data.error) return { ok: false, status: 401 };

  return { ok: true, user: data };
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname)) return NextResponse.next();

  const token = request.cookies.get("token")?.value || "";

  // If user already has a token, avoid showing login/register pages.
  if (token && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Public pages don't require auth.
  if (isPublicPath(pathname)) return NextResponse.next();

  // Everything else requires a token.
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Role-gated pages (e.g. /users, /reports)
  const gate = ROLE_GATES.find((g) => pathname === g.prefix || pathname.startsWith(`${g.prefix}/`));
  if (gate) {
    // Use server-side URL for Docker internal communication
    const apiBase = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3004";
    const me = await fetchMe({ apiBase, token });

    if (!me.ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const role = (me.user?.role ?? "").toString();
    if (!gate.roles.includes(role)) {
      // Show a real “access denied” UI while staying on the original URL.
      const url = request.nextUrl.clone();
      url.pathname = "/forbidden";
      url.searchParams.set("code", "403");
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
