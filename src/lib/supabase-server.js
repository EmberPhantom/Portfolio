import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a standard Supabase client for server-side operations using cookies.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
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
            // Ignore if set in a read context
          }
        },
      },
    }
  );
}

/**
 * Verifies that the current user is authenticated and is the admin user.
 * Returns the admin-authorized client or null.
 */
export async function getSupabaseAdmin(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminUuid = process.env.ADMIN_USER_UUID;

    if (!user || (adminUuid && user.id !== adminUuid)) {
      return null;
    }

    // Return a client using the service role key to perform admin CRUD writes
    const cookieStore = await cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
              // Ignore
            }
          },
        },
      }
    );
  } catch (err) {
    console.error('getSupabaseAdmin Auth error:', err);
    return null;
  }
}

/**
 * Verifies that the current session is active and belongs to the admin.
 * Returns the admin user's session or null.
 */
export async function getSupabaseSession(request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    const adminUuid = process.env.ADMIN_USER_UUID;

    if (!session || (adminUuid && session.user.id !== adminUuid)) {
      return null;
    }

    return session;
  } catch (err) {
    console.error('getSupabaseSession error:', err);
    return null;
  }
}

/**
 * Checks whether the current user is authenticated as an admin.
 * Returns boolean.
 */
export async function checkAdminAuth() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminUuid = process.env.ADMIN_USER_UUID;

    if (!user || (adminUuid && user.id !== adminUuid)) {
      return false;
    }
    return true;
  } catch (err) {
    console.error('checkAdminAuth error:', err);
    return false;
  }
}
