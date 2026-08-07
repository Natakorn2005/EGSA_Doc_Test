import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isSecretaryRole, isSignerRole } from "@/lib/roles";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isSecretaryPath = nextUrl.pathname.startsWith("/secretary");
  const isPresidentPath = nextUrl.pathname.startsWith("/president");
  const isRecordsPath = nextUrl.pathname.startsWith("/records");
  const isRegistryPath = nextUrl.pathname.startsWith("/registry");

  if (!isSecretaryPath && !isPresidentPath && !isRecordsPath && !isRegistryPath) return NextResponse.next();

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const denied =
    (isSecretaryPath && !isSecretaryRole(role || null)) ||
    (isPresidentPath && !isSignerRole(role || null)) ||
    ((isRecordsPath || isRegistryPath) && !isSecretaryRole(role || null) && !isSignerRole(role || null));

  if (denied) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/secretary/:path*", "/president/:path*", "/records/:path*", "/registry/:path*"],
};