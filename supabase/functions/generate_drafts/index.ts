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

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Server Configuration Error: Missing database keys." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Authenticate caller (allow either Deno service token or Admin JWT)
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

    // 2. Parse request payload
    const body = await req.json();
    const { source_id } = body;

    if (!source_id) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing source_id." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the raw content source
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('content_sources')
      .select('*')
      .eq('id', source_id)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ error: "Not Found: Content source does not exist." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Retrieve AI settings from site_config
    const { data: configData } = await supabaseAdmin
      .from('site_config')
      .select('key, value');

    const config: Record<string, string> = {};
    if (configData) {
      configData.forEach(row => {
        config[row.key] = row.value || '';
      });
    }

    const aiProvider = config['ai.provider'] || Deno.env.get('AI_PROVIDER') || 'gemini';
    const aiApiKey = config['ai.api_key'] || Deno.env.get('GROQ_API_KEY') || Deno.env.get('GEMINI_API_KEY');

    const rawContent = source.raw_content || '';
    const title = source.title || 'New Release';

    const platforms = ['twitter', 'linkedin', 'reddit', 'threads', 'instagram'];
    const draftIds: string[] = [];

    // Helper: Prompts per platform
    const getPromptForPlatform = (platform: string) => {
      switch (platform) {
        case 'twitter':
          return `Draft a Twitter thread (3-5 tweets) summarizing this article. First tweet must be a strong hook. Max 280 characters per tweet. Separate tweets in your output with exactly three dashes: "---" on a new line. Do not include tweet numbers like "1/". Here is the content:\n\n${rawContent}`;
        case 'linkedin':
          return `Draft a professional but conversational LinkedIn post summarizing this article. Split paragraphs with double line breaks, outline key takeaways with emojis, and end with a clear CTA to visit pranaychandra.dev. Here is the content:\n\n${rawContent}`;
        case 'reddit':
          return `Draft a Reddit-native post explaining this project for r/webdev or r/programming. Frame it as lessons learned and systems architecture choices. Maintain a friendly developer tone, and do not make it sound like a marketing pitch. Title the post at the top. Here is the content:\n\n${rawContent}`;
        case 'threads':
          return `Draft a short, engaging Threads post (1-3 sentences) summarizing the main hook. Casual and conversational tone. Here is the content:\n\n${rawContent}`;
        case 'instagram':
          return `Draft an Instagram caption summarizing this. Start with a hook, followed by a brief summary, and end with a clean block of 8-12 relevant hashtags. Here is the content:\n\n${rawContent}`;
        default:
          return '';
      }
    };

    // Helper: Mock drafts generator
    const getMockDraft = (platform: string) => {
      switch (platform) {
        case 'twitter':
          return `Just deployed the Build Control Plane to EmberOS. Rebuilt everything from first principles using Deno and Supabase. 🚀\n\n---\nHere's how it works: dashboard triggers a dispatch event, spawning a GitHub runner that reports progress back via authenticated webhooks.\n\n---\nNo more polling: standard Postgres subscriptions stream logs in real-time to a retro monospace terminal widget.`;
        case 'linkedin':
          return `🚀 Rebuilding my developer portfolio platform from first principles.\n\nToday, I completed the Build Control Plane. By separating the control plane (Vercel + Supabase) from the execution plane (GitHub Actions), I keep compute costs at $0 while streaming live docker/bundler logs directly to the dashboard.\n\nKey takeaways:\n1️⃣ Webhooks validate bearer tokens before database writes.\n2️⃣ Real-time postgres channels tail runner outputs at 60fps.\n3️⃣ Clean Next.js proxy route handlers keep secrets hidden.\n\nCheck out the full design at: https://pranaychandra.dev`;
        case 'reddit':
          return `Title: Rebuilding my developer portfolio with a Deno & Supabase Build Control Plane\n\nHey r/webdev,\n\nJust finished a refactor on my portfolio. Instead of standard static showcase files, I wanted to deploy an active control plane where I can manage clones, trigger verify runs, and stream standard console logs in real time.\n\nInstead of hosting a heavy node server to process Deno builds, I split the pipeline: Next.js/Supabase orchestrates, while GitHub actions compile, sending progress milestones back via webhooks.\n\nWould love to hear your thoughts on this design!`;
        case 'threads':
          return `Just finished building the telemetry analytics panel in Deno. Live charts compiled in 40s! 📈`;
        case 'instagram':
          return `Systems architecture: Building clean portfolio telemetries in Deno. 🚀\n\n#nextjs #supabase #deno #fullstack #programming #developer #webdev`;
        default:
          return 'New Post Draft';
      }
    };

    // Generate draft text for each platform
    for (const platform of platforms) {
      let draftText = '';

      if (!aiApiKey) {
        console.warn(`AI API Key missing. Generating mock draft for ${platform}.`);
        draftText = getMockDraft(platform);
      } else {
        try {
          const platformPrompt = getPromptForPlatform(platform);
          
          if (aiProvider === 'groq') {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiApiKey}`
              },
              body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: platformPrompt }]
              })
            });

            if (res.ok) {
              const data = await res.json();
              draftText = data.choices?.[0]?.message?.content || getMockDraft(platform);
            } else {
              throw new Error(`Groq API returned ${res.status}`);
            }
          } else {
            // Default Gemini
            const model = 'gemini-1.5-flash';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiApiKey}`;
            
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: platformPrompt }] }]
              })
            });

            if (res.ok) {
              const data = await res.json();
              draftText = data.candidates?.[0]?.content?.parts?.[0]?.text || getMockDraft(platform);
            } else {
              throw new Error(`Gemini API returned ${res.status}`);
            }
          }
        } catch (err) {
          console.error(`AI Drafting failed for ${platform}, falling back to mock:`, err);
          draftText = getMockDraft(platform);
        }
      }

      // Insert draft record
      const { data: draft, error: draftError } = await supabaseAdmin
        .from('post_drafts')
        .insert({
          source_id,
          platform,
          draft_text: draftText,
          status: 'pending'
        })
        .select()
        .single();

      if (!draftError && draft) {
        draftIds.push(draft.id);
      } else {
        console.error(`Failed to insert post draft:`, draftError);
      }
    }

    // Update source status to processed
    await supabaseAdmin
      .from('content_sources')
      .update({ status: 'processed' })
      .eq('id', source_id);

    return new Response(
      JSON.stringify({ success: true, draft_ids: draftIds }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Exception: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
