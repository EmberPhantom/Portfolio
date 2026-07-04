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
    const { build_id, step_name, message, level = 'info', status, github_run_id } = body;

    if (!build_id || !step_name || !message) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing build_id, step_name, or message." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize service role client to insert/update bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify build exists
    const { data: build, error: buildError } = await supabaseAdmin
      .from('builds')
      .select('id, status')
      .eq('id', build_id)
      .single();

    if (buildError || !build) {
      return new Response(
        JSON.stringify({ error: "Not Found: Build record does not exist." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Insert step log row into build_logs
    const { error: logError } = await supabaseAdmin
      .from('build_logs')
      .insert({
        build_id,
        step_name,
        message,
        level
      });

    if (logError) {
      console.error(`Failed to insert build log: ${logError.message}`);
    }

    // 4. Update parent build row metadata (github_run_id, status)
    const updates: any = {};
    if (github_run_id) {
      updates.github_run_id = github_run_id;
      // Transition from queued -> running if it hasn't progressed already
      if (build.status === 'queued') {
        updates.status = 'running';
      }
    }

    if (status) {
      updates.status = status; // success, failed, or cancelled
      updates.finished_at = new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('builds')
        .update(updates)
        .eq('id', build_id);

      if (updateError) {
        console.error(`Failed to update build parent status: ${updateError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Exception: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
