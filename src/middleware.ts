import { NextResponse, type NextRequest } from "next/server";
import { passwordGateEnabled, sessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (!passwordGateEnabled()) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie === (await sessionToken())) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!api/webhooks|login|api/login|_next/static|_next/image|favicon.ico|logo.avif).*)",
  ],
};
