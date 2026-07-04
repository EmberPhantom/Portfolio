import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookSecret = Deno.env.get('SUPABASE_WEBHOOK_SECRET');

  if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Server Configuration Error: Missing environment secrets." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Authenticate calling Webhook (Shared Secret Token validation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing Webhook Secret Bearer Token." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request payload
    const body = await req.json();
    const { title, url, raw_content, episode_id = null } = body;

    if (!title || !raw_content) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing title or raw_content." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize service role client to insert data bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Insert record into content_sources
    const { data: sourceRow, error: insertError } = await supabaseAdmin
      .from('content_sources')
      .insert({
        source_type: 'blog',
        title,
        url: url || null,
        raw_content,
        episode_id,
        status: 'new'
      })
      .select()
      .single();

    if (insertError || !sourceRow) {
      throw new Error(`Failed to insert content source: ${insertError?.message || "unknown"}`);
    }

    return new Response(
      JSON.stringify({ success: true, source_id: sourceRow.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Exception: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
