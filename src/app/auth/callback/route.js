import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as redirect, else redirect to /admin
  const next = searchParams.get('next') ?? '/admin';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check admin user guard
      const { data: { user } } = await supabase.auth.getUser();
      const adminUuid = process.env.ADMIN_USER_UUID;
      if (user && adminUuid && user.id !== adminUuid) {
        // Sign out if not the admin
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to login page with error
  return NextResponse.redirect(`${origin}/admin/login?error=auth-failed`);
}
