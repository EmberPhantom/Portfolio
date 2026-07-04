import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const FALLBACK_PROJECTS = [
  {
    id: 'contexia',
    name: 'Contexia_AI',
    slug: 'contexia',
    description: 'This is an AI tool that takes context from the user and automatically creates matter to post on social media platforms such as LinkedIn, Twitter(X), Thread.etc.',
    tech_stack: ['Next.js', 'Django REST', 'Supabase', 'pgvector'],
    status: 'live',
    is_featured: true,
    html_url: 'https://github.com/pranaychandra/contexia'
  },
  {
    id: 'ansertech',
    name: 'AnserTech_Voice_AI_Core',
    slug: 'ansertech',
    description: 'Founded to deliver a bidirectional real-time audio pipeline running at sub-500ms response speeds.',
    tech_stack: ['FastAPI', 'Django REST', 'WebSockets', 'Voice AI'],
    status: 'live',
    is_featured: true,
    html_url: 'https://github.com/pranaychandra/ansertech'
  },
  {
    id: 'archonix',
    name: 'Archonix',
    slug: 'archonix',
    description: 'Created to prototype an autonomous compiler engine that tests and deploys code modules sequentially based on prompts.',
    tech_stack: ['Django Channels', 'Next.js', 'Celery', 'Redis'],
    status: 'live',
    is_featured: true,
    html_url: 'https://github.com/pranaychandra/archonix'
  },
  {
    id: 'guidey',
    name: 'Guidey_AI_Mobile',
    slug: 'guidey',
    description: 'Engineered a serverless mobile assistant to synthesize curated lessons and adaptive quizzes.',
    tech_stack: ['React Native', 'Hono.js', 'Cloudflare Workers', 'D1'],
    status: 'live',
    is_featured: true,
    html_url: 'https://github.com/pranaychandra/guidey'
  }
];

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
              // Ignore if set in a read context
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

    // Return a client using the service role key to perform admin CRUD writes
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

// GET all or single clone project
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const featured = searchParams.get('featured');

  try {
    let supabase = await getSupabaseAdmin(request);
    let isAdminCall = !!supabase;
    
    if (!supabase) {
      const cookieStore = await cookies();
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {}
          }
        }
      );
    }

    if (id) {
      const { data, error } = await supabase
        .from('clone_projects')
        .select('*, series:series_id(id, title)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    let query = supabase
      .from('clone_projects')
      .select('*, series:series_id(id, title)');

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // If not admin, only fetch live/building statuses
    if (!isAdminCall) {
      query = query.in('status', ['live', 'building']);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error('API GET Projects Error, returning mock fallback data:', err);
    
    // In case of connection failure, return mock local featured database
    if (id) {
      const singleMock = FALLBACK_PROJECTS.find(p => p.id === id);
      return NextResponse.json(singleMock || FALLBACK_PROJECTS[0]);
    }
    
    let resultList = FALLBACK_PROJECTS;
    if (featured === 'true') {
      resultList = resultList.filter(p => p.is_featured);
    }
    
    return NextResponse.json(resultList);
  }
}

// POST create project
export async function POST(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, target_company, description, github_repo_url, github_repo_full_name, live_url, status, tech_stack, architecture_notes, is_public_buildable, is_featured, series_id } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Missing name or slug' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clone_projects')
      .insert({
        name,
        slug,
        target_company,
        description,
        github_repo_url,
        github_repo_full_name,
        live_url,
        status: status || 'planned',
        tech_stack: tech_stack || [],
        architecture_notes,
        is_public_buildable: !!is_public_buildable,
        is_featured: !!is_featured,
        series_id: series_id || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update project
export async function PUT(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, slug, target_company, description, github_repo_url, github_repo_full_name, live_url, status, tech_stack, architecture_notes, is_public_buildable, is_featured, series_id } = body;

    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'Missing id, name, or slug' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clone_projects')
      .update({
        name,
        slug,
        target_company,
        description,
        github_repo_url,
        github_repo_full_name,
        live_url,
        status,
        tech_stack: tech_stack || [],
        architecture_notes,
        is_public_buildable: !!is_public_buildable,
        is_featured: !!is_featured,
        series_id: series_id || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE project
export async function DELETE(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const { error } = await supabase
      .from('clone_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
