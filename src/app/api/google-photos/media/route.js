import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getValidToken(supabase) {
  const { data } = await supabase.from('oauth_tokens').select('*').eq('provider', 'google_photos').single();
  if (!data) return null;

  // Refresh token if expired
  if (new Date(data.expires_at) < new Date()) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: data.refresh_token, grant_type: 'refresh_token' }),
    });
    const refreshed = await res.json();
    if (refreshed.access_token) {
      await supabase.from('oauth_tokens').update({ access_token: refreshed.access_token, expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString() }).eq('provider', 'google_photos');
      return refreshed.access_token;
    }
    return null;
  }
  return data.access_token;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pageToken = searchParams.get('pageToken') || '';
  const albumId = searchParams.get('albumId') || '';

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const token = await getValidToken(supabase);
  if (!token) return NextResponse.json({ error: 'Not authenticated with Google Photos' }, { status: 401 });

  try {
    let url, options;
    if (albumId) {
      url = 'https://photoslibrary.googleapis.com/v1/mediaItems:search';
      options = { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ albumId, pageSize: 24, pageToken }) };
    } else {
      url = `https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=24${pageToken ? `&pageToken=${pageToken}` : ''}`;
      options = { headers: { Authorization: `Bearer ${token}` } };
    }

    const res = await fetch(url, options);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
