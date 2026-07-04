import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Only run on /admin routes, excluding the login page
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    let user = null;
    let isSupabaseOffline = false;
    try {
      const {
        data: { user: foundUser },
      } = await supabase.auth.getUser();
      user = foundUser;
    } catch (err) {
      console.error('Middleware Auth Error (unreachable Supabase):', err.message);
      const msg = err.message || "";
      if (msg.includes("fetch") || msg.includes("ENOTFOUND") || msg.includes("connect")) {
        isSupabaseOffline = true;
      }
    }

    const adminUuid = process.env.ADMIN_USER_UUID;

    // Check for offline/local bypass cookie when Supabase is unreachable
    const bypassCookie = request.cookies.get('emberos_offline_bypass')?.value;
    const isOfflineBypassed = bypassCookie === 'true';

    if (isSupabaseOffline && isOfflineBypassed) {
      return response;
    }

    if (!user || (adminUuid && user.id !== adminUuid)) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      
      // Sign out unauthorized user
      if (user) {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          // Ignore
        }
      }
      return NextResponse.redirect(url);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
