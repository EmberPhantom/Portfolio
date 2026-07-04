import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSupabaseClient(request, useServiceRole = false) {
  try {
    const cookieStore = await cookies();
    
    // Verify admin session first
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
              // Ignore
            }
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    const adminUuid = process.env.ADMIN_USER_UUID;

    if (!session || (adminUuid && session.user.id !== adminUuid)) {
      return null;
    }

    if (useServiceRole) {
      return {
        supabase: createServerClient(
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
        ),
        token: session.access_token
      };
    }

    return { supabase, token: session.access_token };
  } catch (err) {
    console.error('getSupabaseClient error in analytics insights:', err);
    return null;
  }
}

// GET latest insight summary
export async function GET(request) {
  try {
    const authData = await getSupabaseClient(request, true);
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabase: supabaseAdmin } = authData;

    const { data, error } = await supabaseAdmin
      .from('growth_insights')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json(data || { summary_md: 'No growth insight generated yet.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST trigger AI insight compilation
export async function POST(request) {
  try {
    const authData = await getSupabaseClient(request, false);
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = authData;

    // Trigger Supabase Deno Edge Function
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate_insights`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Failed to compile growth insights' }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
