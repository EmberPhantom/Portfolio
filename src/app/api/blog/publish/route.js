import { getSupabaseAdmin } from '../../../../lib/supabase-server';
import { NextResponse } from 'next/server';

// POST trigger blog post ingestion and draft generation
export async function POST(request) {
  try {
    const supabase = await getSupabaseAdmin(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json({ error: 'Missing post_id' }, { status: 400 });
    }

    // 1. Fetch the blog post details
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET || '';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!webhookSecret || !supabaseUrl) {
      return NextResponse.json({ error: 'System environment configuration error' }, { status: 500 });
    }

    // 2. Call ingest_blog_post Edge Function
    const ingestUrl = `${supabaseUrl}/functions/v1/ingest_blog_post`;
    const ingestRes = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify({
        title: post.title,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pranaychandra.dev'}/blog/${post.slug}`,
        raw_content: post.content
      })
    });

    if (!ingestRes.ok) {
      const errorText = await ingestRes.text();
      return NextResponse.json({ error: `Blog ingestion failed: ${errorText}` }, { status: ingestRes.status });
    }

    const ingestData = await ingestRes.json();
    const sourceId = ingestData.source_id;

    if (!sourceId) {
      return NextResponse.json({ error: 'Ingestion function did not return a valid source_id' }, { status: 500 });
    }

    // 3. Call generate_drafts Edge Function (authenticated via the webhook secret/service role key)
    const generateUrl = `${supabaseUrl}/functions/v1/generate_drafts`;
    const generateRes = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || webhookSecret}`
      },
      body: JSON.stringify({ source_id: sourceId })
    });

    if (!generateRes.ok) {
      const errorText = await generateRes.text();
      return NextResponse.json({ 
        warning: 'Blog ingested, but draft generation failed.', 
        error: errorText, 
        source_id: sourceId 
      }, { status: 200 });
    }

    const generateData = await generateRes.json();
    return NextResponse.json({ success: true, source_id: sourceId, drafts: generateData.draft_ids });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
