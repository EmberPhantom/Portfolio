import { getSupabaseAdmin } from '../../../lib/supabase-server';
import { NextResponse } from 'next/server';

// GET calendar events
export async function GET(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { data, error } = await supabase
        .from('content_calendar')
        .select('*, related_episode:related_episode_id(id, title)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from('content_calendar')
      .select('*, related_episode:related_episode_id(id, title)')
      .order('scheduled_for', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create calendar event
export async function POST(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, title, notes, scheduled_for, status, related_episode_id } = body;

    if (!title || !scheduled_for || !platform) {
      return NextResponse.json({ error: 'Missing title, scheduled_for, or platform' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('content_calendar')
      .insert({
        platform,
        title,
        notes: notes || null,
        scheduled_for: new Date(scheduled_for).toISOString(),
        status: status || 'planned',
        related_episode_id: related_episode_id || null
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update calendar event
export async function PUT(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, platform, title, notes, scheduled_for, status, related_episode_id } = body;

    if (!id || !title || !scheduled_for || !platform) {
      return NextResponse.json({ error: 'Missing id, title, scheduled_for, or platform' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('content_calendar')
      .update({
        platform,
        title,
        notes: notes || null,
        scheduled_for: new Date(scheduled_for).toISOString(),
        status,
        related_episode_id: related_episode_id || null
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

// DELETE calendar event
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
      .from('content_calendar')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
