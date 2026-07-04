import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookSecret = Deno.env.get('SUPABASE_WEBHOOK_SECRET');

  if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Server Configuration Error: Missing secrets." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Authenticate calling Webhook (Shared Secret Token validation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing Webhook Secret." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request payload
    const body = await req.json();
    const { clip_job_id, status, output_url, github_run_id } = body;

    if (!clip_job_id || !status) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing clip_job_id or status." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize service role client to bypass RLS constraints
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify job exists
    const { data: job, error: jobError } = await supabaseAdmin
      .from('clip_jobs')
      .select('id')
      .eq('id', clip_job_id)
      .single();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Not Found: Clip job does not exist." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Update the clip job status
    const updates: Record<string, any> = { status };
    if (output_url) updates.output_url = output_url;
    if (github_run_id) updates.github_run_id = github_run_id;

    const { error: updateError } = await supabaseAdmin
      .from('clip_jobs')
      .update(updates)
      .eq('id', clip_job_id);

    if (updateError) {
      throw new Error(`Failed to update clip job status: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
