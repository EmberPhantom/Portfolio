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
  const githubPat = Deno.env.get('GITHUB_PAT');
  const githubUsername = Deno.env.get('GITHUB_USERNAME') || 'EmberPhantom';

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server Configuration Error: Missing database keys." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // If PAT is missing, mock stats in local development
    if (!githubPat) {
      console.warn("GITHUB_PAT missing. Seeding simulated GitHub metrics.");
      
      const mockFollowers = 820 + Math.floor(Math.random() * 5);
      const mockStars = 3200 + Math.floor(Math.random() * 20);

      const { data, error } = await supabaseAdmin
        .from('social_metrics')
        .upsert({
          platform: 'github',
          metric_date: new Date().toISOString().split('T')[0],
          followers: mockFollowers,
          views: mockStars,
          extra: { total_stars: mockStars, note: "Simulated statistics (missing GITHUB_PAT)" },
          source: 'api'
        }, { onConflict: 'platform, metric_date' })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1. Fetch user followers
    const userUrl = `https://api.github.com/users/${githubUsername}`;
    const userRes = await fetch(userUrl, {
      headers: {
        'Authorization': `token ${githubPat}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'EmberOS-Metrics-Sync'
      }
    });

    if (!userRes.ok) {
      throw new Error(`GitHub User API returned status ${userRes.status}`);
    }

    const userData = await userRes.json();
    const followers = userData.followers || 0;

    // 2. Fetch tracked projects to query repo metrics
    const { data: projects } = await supabaseAdmin
      .from('clone_projects')
      .select('id, name, github_repo_full_name')
      .not('github_repo_full_name', 'is', null);

    let totalStars = 0;
    let totalForks = 0;
    const repoBreakdown: Record<string, any> = {};

    if (projects) {
      for (const proj of projects) {
        const repoFullName = proj.github_repo_full_name;
        if (!repoFullName) continue;

        try {
          const repoUrl = `https://api.github.com/repos/${repoFullName}`;
          const repoRes = await fetch(repoUrl, {
            headers: {
              'Authorization': `token ${githubPat}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'EmberOS-Metrics-Sync'
            }
          });

          if (repoRes.ok) {
            const repoData = await repoRes.json();
            const stars = repoData.stargazers_count || 0;
            const forks = repoData.forks_count || 0;

            totalStars += stars;
            totalForks += forks;
            repoBreakdown[repoFullName] = {
              project_id: proj.id,
              name: proj.name,
              stars,
              forks
            };
          }
        } catch (repoErr) {
          console.error(`Failed to sync repository stats for ${repoFullName}:`, repoErr);
        }
      }
    }

    // Upsert GitHub metrics (we store accumulated stars as the 'views' field for generic scaling)
    const { data: metricsRow, error: upsertError } = await supabaseAdmin
      .from('social_metrics')
      .upsert({
        platform: 'github',
        metric_date: new Date().toISOString().split('T')[0],
        followers,
        views: totalStars,
        extra: {
          total_stars: totalStars,
          total_forks: totalForks,
          repositories: repoBreakdown
        },
        source: 'api'
      }, { onConflict: 'platform, metric_date' })
      .select();

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ success: true, metricsRow }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Exception: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
