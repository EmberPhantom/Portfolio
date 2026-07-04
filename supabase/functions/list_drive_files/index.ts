import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getDriveAccessToken() {
  const refreshToken = Deno.env.get('DRIVE_REFRESH_TOKEN');
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Google Drive API environment credentials missing.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&refresh_token=${encodeURIComponent(refreshToken)}&grant_type=refresh_token`
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google OAuth token exchange failed [${res.status}]: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server Configuration Error: Missing database keys." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Authenticate caller (Admin validation)
    const authHeader = req.headers.get('Authorization');
    let isAuthorized = false;

    if (authHeader === `Bearer ${supabaseServiceKey}`) {
      isAuthorized = true;
    } else if (authHeader) {
      const clientSupabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await clientSupabase.auth.getUser();
      if (user) {
        const { data: isAdmin } = await clientSupabase.rpc('is_admin');
        if (isAdmin) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Access restricted to admins." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get Access Token
    let accessToken;
    try {
      accessToken = await getDriveAccessToken();
    } catch (tokenErr) {
      // Return simulated mock list if credentials not fully configured (local dev fallback)
      console.warn("Drive authentication failed, serving simulated list:", tokenErr.message);
      const mockFiles = [
        { id: "mock-1", name: "stripe_clone_architecture.png", thumbnailLink: "https://picsum.photos/seed/stripe/300/200", webViewLink: "#" },
        { id: "mock-2", name: "compiler_logs_terminal.png", thumbnailLink: "https://picsum.photos/seed/terminal/300/200", webViewLink: "#" },
        { id: "mock-3", name: "redis_caching_layout.png", thumbnailLink: "https://picsum.photos/seed/redis/300/200", webViewLink: "#" },
        { id: "mock-4", name: "supabase_rls_diagram.png", thumbnailLink: "https://picsum.photos/seed/supabase/300/200", webViewLink: "#" }
      ];
      return new Response(
        JSON.stringify({ files: mockFiles, simulated: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Query Drive folder
    const folderId = Deno.env.get('DRIVE_FOLDER_ID') || 'root';
    const driveUrl = `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(folderId)}'+in+parents+and+mimeType+startsWith+'image/'&fields=files(id,name,thumbnailLink,webViewLink)&key=${Deno.env.get('GOOGLE_API_KEY') || ''}`;

    const driveRes = await fetch(driveUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      throw new Error(`Google Drive API returned error [${driveRes.status}]: ${errText}`);
    }

    const driveData = await driveRes.json();
    return new Response(
      JSON.stringify({ files: driveData.files || [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
