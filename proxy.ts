import { auth } from "@/auth";
import { NextResponse } from "next/server";

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

  if ((isSecretary && role !== "secretary") || (isPresident && role !== "president")) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/secretary/:path*", "/president/:path*"],
};