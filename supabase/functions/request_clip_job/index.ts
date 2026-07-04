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
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const githubPat = Deno.env.get('GITHUB_PAT');
  const githubUsername = Deno.env.get('GITHUB_USERNAME') || 'EmberPhantom';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !githubPat) {
    return new Response(
      JSON.stringify({ error: "Server Configuration Error: Missing secrets." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Authenticate caller (Admin JWT)
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

    // 2. Parse payload
    const body = await req.json();
    const { source_id, start_seconds, end_seconds } = body;

    if (!source_id || start_seconds === undefined || end_seconds === undefined) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing source_id, start_seconds, or end_seconds." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch content source details
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('content_sources')
      .select('*')
      .eq('id', source_id)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ error: "Not Found: Content source not found." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoUrl = source.url || '';
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Content source does not have a valid video URL." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Insert clip_jobs row (status = 'queued')
    const { data: job, error: jobError } = await supabaseAdmin
      .from('clip_jobs')
      .insert({
        source_id,
        status: 'queued',
        start_seconds: parseInt(start_seconds, 10),
        end_seconds: parseInt(end_seconds, 10)
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to queue clip job: ${jobError?.message || 'unknown'}`);
    }

    // 4. Trigger GitHub Action (ffmpeg clip workflow)
    // We send a dispatch event to the main portfolio repo, which holds the ffmpeg action
    const repoName = Deno.env.get('GITHUB_WORKFLOWS_REPO') || 'pranay-portfolio';
    const dispatchUrl = `https://api.github.com/repos/${githubUsername}/${repoName}/actions/workflows/ffmpeg_clip.yml/dispatches`;

    const dispatchResponse = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'EmberOS-Clip-Dispatcher'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          clip_job_id: job.id,
          video_url: videoUrl,
          start_seconds: start_seconds.toString(),
          end_seconds: end_seconds.toString()
        }
      })
    });

    if (dispatchResponse.status !== 204) {
      const errorText = await dispatchResponse.text();
      
      // Update job status to failed immediately
      await supabaseAdmin
        .from('clip_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);

      throw new Error(`GitHub dispatch failed [${dispatchResponse.status}]: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, clip_job_id: job.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
