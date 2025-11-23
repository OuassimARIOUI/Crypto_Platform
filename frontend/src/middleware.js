import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("token");

    const protectedRoutes = [
        "/dashboard",
        "/portfolio",
        "/trading",
        "/indicators",
        "/profile"
    ];

    const { pathname } = req.nextUrl;

    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        if (!token) {
            const loginUrl = new URL("/login", req.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}
