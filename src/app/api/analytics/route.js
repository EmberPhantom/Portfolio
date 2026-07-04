import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkAdminAuth } from '../../../lib/supabase-server';

export async function GET(request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const days = parseInt(daysParam, 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Query database using service client to read metrics bypassing RLS if needed, 
    // or anon client (which requires read policies)
    // Since social_metrics is admin-only, we must query via service client.
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
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

    const { data, error } = await supabaseAdmin
      .from('social_metrics')
      .select('*')
      .gte('metric_date', startDateStr)
      .order('metric_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST insert or update social metrics (manual logs, e.g. LinkedIn)
export async function POST(request) {
  try {
    const isAuthorized = await checkAdminAuth();
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, metric_date, followers, views, impressions, engagement_count, extra, source = 'manual' } = body;

    if (!platform || !metric_date) {
      return NextResponse.json({ error: 'Missing platform or metric_date' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
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

    const { data, error } = await supabaseAdmin
      .from('social_metrics')
      .upsert({
        platform,
        metric_date,
        followers: followers !== undefined && followers !== null ? parseInt(followers, 10) : null,
        views: views !== undefined && views !== null ? parseInt(views, 10) : null,
        impressions: impressions !== undefined && impressions !== null ? parseInt(impressions, 10) : null,
        engagement_count: engagement_count !== undefined && engagement_count !== null ? parseInt(engagement_count, 10) : null,
        extra: extra || {},
        source
      }, { onConflict: 'platform, metric_date' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
