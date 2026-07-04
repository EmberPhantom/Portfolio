import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { NextResponse } from 'next/server';

// GET all drafts in the review queue
export async function GET(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('post_drafts')
      .select('*, content_sources:source_id(id, title, url, source_type)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update draft parameters (inline edits, status changes)
export async function PUT(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, draft_text, status, thumbnail_url, external_post_url, reddit_subreddit } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing draft id' }, { status: 400 });
    }

    const updates = {};
    if (draft_text !== undefined) updates.draft_text = draft_text;
    if (status !== undefined) updates.status = status;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
    if (reddit_subreddit !== undefined) updates.reddit_subreddit = reddit_subreddit;
    if (external_post_url !== undefined) {
      updates.external_post_url = external_post_url;
      updates.posted_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('post_drafts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
