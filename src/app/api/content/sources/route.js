import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getSupabaseAdmin(request) {
  try {
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
              // Ignore
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const adminUuid = process.env.ADMIN_USER_UUID;

    if (!user || (adminUuid && user.id !== adminUuid)) {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();

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
      token: session?.access_token
    };
  } catch (err) {
    console.error('getSupabaseAdmin error in content sources:', err);
    return null;
  }
}

// GET all content sources
export async function GET(request) {
  try {
    const authData = await getSupabaseAdmin(request);
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabase: supabaseAdmin } = authData;

    const { data, error } = await supabaseAdmin
      .from('content_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST ingest a new source and trigger drafts generation
export async function POST(request) {
  try {
    const authData = await getSupabaseAdmin(request);
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabase: supabaseAdmin, token } = authData;
    const body = await request.json();
    const { title, url, raw_content, source_type = 'manual' } = body;

    if (!title || !raw_content) {
      return NextResponse.json({ error: 'Missing title or raw_content' }, { status: 400 });
    }

    // Insert source record
    const { data: source, error: insertError } = await supabaseAdmin
      .from('content_sources')
      .insert({
        title,
        url: url || null,
        raw_content,
        source_type,
        status: 'new'
      })
      .select()
      .single();

    if (insertError || !source) {
      throw new Error(`Failed to insert source: ${insertError?.message || "unknown"}`);
    }

    // Trigger generate_drafts Edge Function synchronously or asynchronously
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate_drafts`;
    
    // Trigger in the background
    fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ source_id: source.id })
    }).catch(err => {
      console.error("Async draft generation trigger failed:", err);
    });

    return NextResponse.json(source);

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
