import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Get the latest token from our oauth_tokens table
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('provider', 'google')
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'No Google OAuth token found. Please link your account in Dashboard Settings.' }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/google-photos/callback`
    );

    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expiry_date: tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : null,
    });

    // 2. Check and Refresh Token if needed
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await supabase
          .from('oauth_tokens')
          .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          })
          .eq('provider', 'google');
      } else {
        await supabase
          .from('oauth_tokens')
          .update({
            access_token: tokens.access_token,
            expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          })
          .eq('provider', 'google');
      }
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 3. List image/video files from Drive
    const response = await drive.files.list({
      pageSize: 40,
      fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, iconLink)',
      q: "mimeType contains 'image/' or mimeType contains 'video/'",
      orderBy: 'modifiedTime desc',
    });

    // Transform Drive files to match the picker's expected format
    const mediaItems = response.data.files.map(file => ({
      id: file.id,
      filename: file.name,
      baseUrl: file.thumbnailLink?.replace(/=s220$/, '=s1000'), // High res thumbnail
      productUrl: file.webViewLink,
      mimeType: file.mimeType,
      source: 'google-drive'
    }));

    return NextResponse.json({ mediaItems });
  } catch (error) {
    console.error('Google Drive API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
