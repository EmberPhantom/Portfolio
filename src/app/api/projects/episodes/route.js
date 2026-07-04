import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { NextResponse } from 'next/server';

// GET episodes (all, single, or filtered by project_id / series_id)
export async function GET(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('project_id');
    const seriesId = searchParams.get('series_id');

    let query = supabase
      .from('episodes')
      .select('*, project:project_id(id, name), series:series_id(id, title)');

    if (id) {
      const { data, error } = await query.eq('id', id).single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (seriesId) {
      query = query.eq('series_id', seriesId);
    }

    const { data, error } = await query.order('episode_number', { ascending: true });
    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create episode
export async function POST(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, series_id, episode_number, title, status, youtube_url, script_md, published_at } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('episodes')
      .insert({
        project_id: project_id || null,
        series_id: series_id || null,
        episode_number: episode_number || null,
        title,
        status: status || 'planned',
        youtube_url: youtube_url || null,
        script_md: script_md || null,
        published_at: published_at || null
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update episode
export async function PUT(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, project_id, series_id, episode_number, title, status, youtube_url, script_md, published_at } = body;

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing id or title' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('episodes')
      .update({
        project_id: project_id || null,
        series_id: series_id || null,
        episode_number: episode_number || null,
        title,
        status,
        youtube_url: youtube_url || null,
        script_md: script_md || null,
        published_at: published_at || null
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

// DELETE episode
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
      .from('episodes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
