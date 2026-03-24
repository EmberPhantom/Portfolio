import Groq from 'groq-sdk';
import { supabase } from '../supabase';

const RECENT_LIMIT = 10;

// ── Google Token Management ───────────────────────────
async function getValidToken(provider) {
  const { data } = await supabase.from('oauth_tokens').select('*').eq('provider', provider).single();
  if (!data) return null;

  if (new Date(data.expires_at) < new Date()) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: data.refresh_token,
        grant_type: 'refresh_token'
      }),
    });
    const refreshed = await res.json();
    if (refreshed.access_token) {
      await supabase.from('oauth_tokens').update({
        access_token: refreshed.access_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      }).eq('provider', provider);
      return refreshed.access_token;
    }
    return null;
  }
  return data.access_token;
}

// ── GitHub Activity Fetch ─────────────────────────────
async function fetchGitHubPulse() {
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME || 'pranay-chandra';
  try {
    const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=${RECENT_LIMIT}`);
    const events = await res.json();
    return events.filter(e => e.type === 'PushEvent').map(e => ({
      repo: e.repo.name,
      commits: e.payload.commits?.map(c => c.message) || [],
      date: e.created_at
    }));
  } catch (err) {
    console.error('GitHub Sync Error:', err);
    return [];
  }
}

// ── Google Photos Activity ────────────────────────────
async function fetchPhotoInsights(whitelistedAlbums) {
  const token = await getValidToken('google_photos');
  if (!token || !whitelistedAlbums || whitelistedAlbums.length === 0) return [];

  // Note: For simplicity, we search the most recent items 
  // and check if they belong to whitelisted albums if possible, 
  // or just search within those albums specifically.
  try {
    const allInsights = [];
    for (const albumName of whitelistedAlbums) {
      // 1. Find album ID by name (Optional: cache this)
      const listRes = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { albums = [] } = await listRes.json();
      const targetAlbum = albums.find(a => a.title.toLowerCase() === albumName.toLowerCase());
      
      if (targetAlbum) {
        const searchRes = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ albumId: targetAlbum.id, pageSize: 5 })
        });
        const { mediaItems = [] } = await searchRes.json();
        mediaItems.forEach(item => {
          allInsights.push({
            type: 'photo',
            description: item.description || 'Untagged Photo',
            date: item.mediaMetadata.creationTime,
            baseUrl: item.baseUrl
          });
        });
      }
    }
    return allInsights;
  } catch (err) {
    console.error('Photos Sync Error:', err);
    return [];
  }
}

// ── Google Drive Activity ────────────────────────────
async function fetchDriveInsights(whitelistedFolders) {
  const token = await getValidToken('google_photos'); // Shared token for now
  if (!token || !whitelistedFolders || whitelistedFolders.length === 0) return [];

  try {
    const allInsights = [];
    for (const folderPath of whitelistedFolders) {
      // Find files in folder (this is simplified, uses path as a 'q' search for now)
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=name contains '${folderPath}'&pageSize=5&orderBy=modifiedTime desc&fields=files(id, name, mimeType, modifiedTime)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { files = [] } = await res.json();
      files.forEach(f => {
        allInsights.push({
          type: 'file',
          name: f.name,
          date: f.modifiedTime
        });
      });
    }
    return allInsights;
  } catch (err) {
    console.error('Drive Sync Error:', err);
    return [];
  }
}

// ── Intelligence Sync Core ───────────────────────────
export async function syncIntelligence() {
  if (!supabase) return;

  // 1. Fetch Metadata (Scoping)
  const { data: metaRows } = await supabase.from('intelligence_meta').select('*');
  const scoping = metaRows?.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {}) || {};

  // 2. Fetch Source Data
  const github = scoping.github_sync_enabled ? await fetchGitHubPulse() : [];
  const photos = await fetchPhotoInsights(scoping.whitelisted_photo_albums);
  const drive = await fetchDriveInsights(scoping.whitelisted_drive_folders);

  // 3. Reflect & Synthesize with AI
  const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY, dangerouslyAllowBrowser: true });
  
  const prompt = `You are a Person Context Engine. Analyze the following digital activity logs and generate a concise summary of what Pranay Chandra is currently focusing on in his life and career.
  
  GITHUB: ${JSON.stringify(github)}
  PHOTOS: ${JSON.stringify(photos)}
  DRIVE: ${JSON.stringify(drive)}
  
  Return a compact JSON object:
  {
    "current_focus": "string",
    "recent_milestones": ["string"],
    "suggested_actions": ["string"],
    "life_mood": "string"
  }`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });
    
    const insight = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    // 4. Update Long Term Memory
    await supabase.from('ai_user_context').upsert({
      key: 'living_context',
      value: JSON.stringify(insight),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    // 5. Log the Sync
    await supabase.from('intelligence_logs').insert({
      source: 'omni_sync',
      content: JSON.stringify({ github, photos, drive }),
      insight: JSON.stringify(insight)
    });

    return insight;
  } catch (err) {
    console.error('Intelligence Synthesis Error:', err);
    return null;
  }
}
