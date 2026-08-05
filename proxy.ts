import { auth } from "@/auth";
import { NextResponse } from "next/server";

const SIGNER_ROLES = ["president", "vp_internal", "vp_external"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isSecretary = nextUrl.pathname.startsWith("/secretary");
  const isPresident = nextUrl.pathname.startsWith("/president");

  if (!isSecretary && !isPresident) return NextResponse.next();

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if ((isSecretary && role !== "secretary") || (isPresident && !SIGNER_ROLES.includes(role || ""))) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/secretary/:path*", "/president/:path*"],
};