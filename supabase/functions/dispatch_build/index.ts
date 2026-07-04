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
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const githubPat = Deno.env.get('GITHUB_PAT');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || !githubPat) {
    return new Response(
      JSON.stringify({ error: "Server Configuration Error: Missing environment secrets." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Authenticate the caller (User JWT validation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await clientSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: `Unauthorized: User session invalid - ${authError?.message || "unknown"}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call dynamic database RPC check helper is_admin()
    const { data: isAdmin, error: rpcError } = await clientSupabase.rpc('is_admin');
    if (rpcError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Caller is not an admin." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse payload request
    const body = await req.json();
    const { project_id, github_repo_full_name, workflow_file = 'build.yml' } = body;

    if (!project_id || !github_repo_full_name) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing project_id or github_repo_full_name." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize service role client to insert data bypassing RLS constraints
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('clone_projects')
      .select('id, name')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Not Found: Tracked project record does not exist." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Create the build row in database (status = queued)
    const { data: build, error: insertError } = await supabaseAdmin
      .from('builds')
      .insert({
        project_id: project.id,
        workflow_name: workflow_file,
        status: 'queued',
        triggered_by: 'dashboard'
      })
      .select()
      .single();

    if (insertError || !build) {
      return new Response(
        JSON.stringify({ error: `Internal DB Error: Failed to insert build record - ${insertError?.message || "unknown"}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add initial log
    await supabaseAdmin.from('build_logs').insert({
      build_id: build.id,
      step_name: 'dispatch',
      message: `Triggering workflow dispatch on repository ${github_repo_full_name}...`,
      level: 'info'
    });

    // 4. Trigger GitHub dispatch call
    const dispatchUrl = `https://api.github.com/repos/${github_repo_full_name}/actions/workflows/${workflow_file}/dispatches`;
    const response = await fetch(dispatchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'EmberOS-Build-Dispatcher'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          build_id: build.id
        }
      })
    });

    if (response.status !== 204) {
      const errorText = await response.text();
      // Fail the build immediately in DB
      await supabaseAdmin
        .from('builds')
        .update({ status: 'failed', finished_at: new Date().toISOString() })
        .eq('id', build.id);

      await supabaseAdmin.from('build_logs').insert({
        build_id: build.id,
        step_name: 'dispatch',
        message: `Failed to dispatch GitHub Actions: [${response.status}] ${errorText}`,
        level: 'error'
      });

      return new Response(
        JSON.stringify({ error: `GitHub API error: ${response.status} - ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ build_id: build.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Exception: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
