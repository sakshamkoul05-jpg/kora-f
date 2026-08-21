import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, newNonce, routeNeedsNonce } from "@/lib/csp";

/**
 * Refreshes the Supabase session cookie on each request, and turns anonymous
 * visitors away from /admin.
 *
 * This is a convenience gate, NOT the security boundary. The real one is Row
 * Level Security: `is_staff()` decides who can read a booking request, and it
 * holds even if this file is bypassed, misconfigured, or removed. Never move a
 * permission check out of the database and into here.
 *
 * It also sets the Content-Security-Policy, which has to happen here because a
 * nonce must be generated per request. See lib/csp.ts for why only some routes
 * get one.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isDev = process.env.NODE_ENV === "development";

  // A nonce is only meaningful on a route rendered per request. Generating one
  // for a static page would put a value in the header that matches nothing in
  // the HTML, and every script on the page would be blocked.
  const nonce = routeNeedsNonce(pathname) ? newNonce() : null;
  const csp = buildCsp({ nonce, isDev });

  const requestHeaders = new Headers(request.headers);
  if (nonce) {
    requestHeaders.set("x-nonce", nonce);
    // Next reads the nonce back out of this header during render and attaches
    // it to the framework scripts itself.
    requestHeaders.set("Content-Security-Policy", csp);
  }

  const withCsp = <T extends NextResponse>(res: T): T => {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  let response = withCsp(NextResponse.next({ request: { headers: requestHeaders } }));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase configured there are no sessions to refresh, and /admin
  // has nothing to show. Let it through to render its own "not configured" state.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = withCsp(NextResponse.next({ request: { headers: requestHeaders } }));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() revalidates against Supabase. getSession() only reads the cookie,
  // which a client can forge — do not swap this for it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = pathname.startsWith("/admin");
  const isLogin = pathname === "/admin/login";

  if (isAdminRoute && !isLogin && !user) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin/login";
    to.searchParams.set("next", pathname);
    return withCsp(NextResponse.redirect(to));
  }

  if (isLogin && user) {
    const to = request.nextUrl.clone();
    to.pathname = "/admin";
    to.search = "";
    return withCsp(NextResponse.redirect(to));
  }

  return response;
}

export const config = {
  // Static assets and images don't need a session round-trip.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|images|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
