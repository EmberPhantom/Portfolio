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
  const xBearerToken = Deno.env.get('X_BEARER_TOKEN');

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server Configuration Error: Missing database keys." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // If Bearer Token is missing, mock stats in local development
    if (!xBearerToken) {
      console.warn("X_BEARER_TOKEN missing. Seeding simulated Twitter/X metrics.");
      
      const mockFollowers = 4120 + Math.floor(Math.random() * 8);
      const mockImpressions = 120500 + Math.floor(Math.random() * 400);

      const { data, error } = await supabaseAdmin
        .from('social_metrics')
        .upsert({
          platform: 'twitter',
          metric_date: new Date().toISOString().split('T')[0],
          followers: mockFollowers,
          views: mockImpressions, // views represent impressions
          extra: { following_count: 512, tweet_count: 1420, note: "Simulated statistics (missing X_BEARER_TOKEN)" },
          source: 'api'
        }, { onConflict: 'platform, metric_date' })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 1. Fetch user statistics from X API v2
    const userUrl = `https://api.twitter.com/2/users/me?user.fields=public_metrics`;
    const response = await fetch(userUrl, {
      headers: {
        'Authorization': `Bearer ${xBearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`X API returned status ${response.status}`);
    }

    const userData = await response.json();
    const metrics = userData.data?.public_metrics;

    if (!metrics) {
      throw new Error("Failed to parse public metrics from X API response.");
    }

    const followers = metrics.followers_count || 0;
    const following = metrics.following_count || 0;
    const tweetCount = metrics.tweet_count || 0;

    // Upsert into social_metrics
    const { data: metricsRow, error: upsertError } = await supabaseAdmin
      .from('social_metrics')
      .upsert({
        platform: 'twitter',
        metric_date: new Date().toISOString().split('T')[0],
        followers,
        views: 0, // impressions/views are null on free tier
        extra: {
          following_count: following,
          tweet_count: tweetCount
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
