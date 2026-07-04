import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { NextResponse } from 'next/server';

// GET community activity logs
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
        .from('community_activity')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from('community_activity')
      .select('*')
      .order('logged_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create community activity log
export async function POST(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, activity_type, url, notes, engagement_count, logged_at } = body;

    if (!platform || !activity_type) {
      return NextResponse.json({ error: 'Missing platform or activity_type' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('community_activity')
      .insert({
        platform,
        activity_type,
        url: url || null,
        notes: notes || null,
        engagement_count: engagement_count ? parseInt(engagement_count, 10) : 0,
        logged_at: logged_at ? new Date(logged_at).toISOString() : new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update community activity log
export async function PUT(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, platform, activity_type, url, notes, engagement_count, logged_at } = body;

    if (!id || !platform || !activity_type) {
      return NextResponse.json({ error: 'Missing id, platform, or activity_type' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('community_activity')
      .update({
        platform,
        activity_type,
        url: url || null,
        notes: notes || null,
        engagement_count: engagement_count ? parseInt(engagement_count, 10) : 0,
        logged_at: logged_at ? new Date(logged_at).toISOString() : new Date().toISOString()
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

// DELETE community activity log
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
      .from('community_activity')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
