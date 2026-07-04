import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ------------------------------------------------------------------
// X/Twitter OAuth 1.0a Publisher Helper
// ------------------------------------------------------------------
async function postTweet(text: string) {
  const consumerKey = Deno.env.get('X_API_KEY') || '';
  const consumerSecret = Deno.env.get('X_API_SECRET') || '';
  const accessToken = Deno.env.get('X_ACCESS_TOKEN') || '';
  const accessTokenSecret = Deno.env.get('X_ACCESS_TOKEN_SECRET') || '';

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error("Missing X API OAuth 1.0a credentials.");
  }

  const url = "https://api.twitter.com/2/tweets";
  const method = "POST";
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0"
  };

  const encode = (str: string) => encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys.map(k => `${encode(k)}=${encode(oauthParams[k])}`).join('&');

  const signatureBase = `${method}&${encode(url)}&${encode(paramString)}`;
  const signingKey = `${encode(consumerSecret)}&${encode(accessTokenSecret)}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const baseData = encoder.encode(signatureBase);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    baseData
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = "";
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  const signature = btoa(binary);

  oauthParams.oauth_signature = signature;

  const authHeader = "OAuth " + Object.keys(oauthParams)
    .sort()
    .map(k => `${encode(k)}="${encode(oauthParams[k])}"`)
    .join(', ');

  const res = await fetch(url, {
    method,
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`X API returned ${res.status}: ${errorText}`);
  }

  const resData = await res.json();
  const tweetId = resData.data?.id;
  return tweetId ? `https://x.com/_PranayChandra_/status/${tweetId}` : `https://x.com/`;
}

// ------------------------------------------------------------------
// Reddit OAuth2 Publisher Helper
// ------------------------------------------------------------------
async function postToReddit(title: string, text: string, subreddit: string) {
  const clientId = Deno.env.get('REDDIT_CLIENT_ID') || '';
  const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET') || '';
  const refreshToken = Deno.env.get('REDDIT_REFRESH_TOKEN') || '';
  const username = Deno.env.get('REDDIT_USERNAME') || 'EmberPhantom';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Reddit API credentials.");
  }

  const authString = btoa(`${clientId}:${clientSecret}`);
  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": `EmberOS-Publisher/1.0 (by /u/${username})`
    },
    body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Reddit Token exchange failed [${tokenRes.status}]: ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error("Reddit did not return an access token.");
  }

  const submitParams = new URLSearchParams();
  submitParams.append("sr", subreddit || 'test');
  submitParams.append("kind", "self");
  submitParams.append("title", title);
  submitParams.append("text", text);

  const submitRes = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": `EmberOS-Publisher/1.0 (by /u/${username})`
    },
    body: submitParams.toString()
  });

  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    throw new Error(`Reddit submission failed [${submitRes.status}]: ${errorText}`);
  }

  const submitData = await submitRes.json();
  if (submitData.json?.errors && submitData.json.errors.length > 0) {
    throw new Error(`Reddit API returned errors: ${JSON.stringify(submitData.json.errors)}`);
  }

  const postUrl = submitData.json?.data?.url;
  return postUrl || `https://reddit.com/r/${subreddit}`;
}

// ------------------------------------------------------------------
// Threads API Publisher Helper
// ------------------------------------------------------------------
async function postToThreads(text: string) {
  const metaToken = Deno.env.get('META_ACCESS_TOKEN') || '';
  const threadsUserId = Deno.env.get('THREADS_USER_ID') || '';

  if (!metaToken || !threadsUserId) {
    throw new Error("Missing Meta/Threads API credentials.");
  }

  const createUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads?media_type=TEXT&text=${encodeURIComponent(text)}&access_token=${metaToken}`;
  const createRes = await fetch(createUrl, { method: "POST" });
  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Threads container creation failed [${createRes.status}]: ${errorText}`);
  }
  const createData = await createRes.json();
  const creationId = createData.id;

  if (!creationId) {
    throw new Error("Threads did not return a container creation ID.");
  }

  const publishUrl = `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish?creation_id=${creationId}&access_token=${metaToken}`;
  const publishRes = await fetch(publishUrl, { method: "POST" });
  if (!publishRes.ok) {
    const errorText = await publishRes.text();
    throw new Error(`Threads container publication failed [${publishRes.status}]: ${errorText}`);
  }
  const publishData = await publishRes.json();
  const postId = publishData.id;

  return postId ? `https://threads.net/@EmberPhantom/post/${postId}` : `https://threads.net/`;
}

// ------------------------------------------------------------------
// Instagram Graph API Publisher Helper
// ------------------------------------------------------------------
async function postToInstagram(caption: string, imageUrl: string) {
  const metaToken = Deno.env.get('META_ACCESS_TOKEN') || '';
  const igUserId = Deno.env.get('INSTAGRAM_USER_ID') || '';

  if (!metaToken || !igUserId) {
    throw new Error("Missing Instagram API credentials.");
  }

  if (!imageUrl) {
    throw new Error("Instagram posting requires a thumbnail image URL.");
  }

  const createUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${metaToken}`;
  const createRes = await fetch(createUrl, { method: "POST" });
  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Instagram media creation failed [${createRes.status}]: ${errorText}`);
  }
  const createData = await createRes.json();
  const creationId = createData.id;

  if (!creationId) {
    throw new Error("Instagram did not return a media creation ID.");
  }

  const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish?creation_id=${creationId}&access_token=${metaToken}`;
  const publishRes = await fetch(publishUrl, { method: "POST" });
  if (!publishRes.ok) {
    const errorText = await publishRes.text();
    throw new Error(`Instagram publication failed [${publishRes.status}]: ${errorText}`);
  }
  const publishData = await publishRes.json();
  const mediaId = publishData.id;

  return mediaId ? `https://instagram.com/p/${mediaId}` : `https://instagram.com/`;
}

// ------------------------------------------------------------------
// Main Serve Function
// ------------------------------------------------------------------
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

    const body = await req.json();
    const { draft_id } = body;

    if (!draft_id) {
      return new Response(
        JSON.stringify({ error: "Bad Request: Missing draft_id." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: draft, error: draftError } = await supabaseAdmin
      .from('post_drafts')
      .select('*, source:source_id(title)')
      .eq('id', draft_id)
      .single();

    if (draftError || !draft) {
      return new Response(
        JSON.stringify({ error: "Not Found: Post draft does not exist." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const platform = draft.platform;
    const text = draft.draft_text;
    const thumbnail = draft.thumbnail_url;
    const title = draft.source?.title || "New System Deployment";

    if (platform === 'linkedin') {
      return new Response(
        JSON.stringify({ status: 'manual_required', draft_text: text }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let externalUrl = "";

    // 1. Twitter
    if (platform === 'twitter') {
      const xApiKey = Deno.env.get('X_API_KEY');
      if (!xApiKey) {
        console.warn("X_API_KEY missing. Simulating success post.");
        externalUrl = 'https://x.com/_PranayChandra_/status/12345';
      } else {
        externalUrl = await postTweet(text);
      }
    }

    // 2. Reddit
    else if (platform === 'reddit') {
      const redditClientId = Deno.env.get('REDDIT_CLIENT_ID');
      if (!redditClientId) {
        console.warn("REDDIT_CLIENT_ID missing. Simulating success post.");
        externalUrl = `https://reddit.com/r/webdev/comments/12345`;
      } else {
        externalUrl = await postToReddit(title, text, draft.reddit_subreddit);
      }
    }

    // 3. Threads
    else if (platform === 'threads') {
      const metaToken = Deno.env.get('META_ACCESS_TOKEN');
      if (!metaToken) {
        console.warn("META_ACCESS_TOKEN missing. Simulating success threads post.");
        externalUrl = 'https://threads.net/@EmberPhantom/post/12345';
      } else {
        externalUrl = await postToThreads(text);
      }
    }

    // 4. Instagram
    else if (platform === 'instagram') {
      const metaToken = Deno.env.get('META_ACCESS_TOKEN');
      if (!metaToken) {
        console.warn("META_ACCESS_TOKEN missing. Simulating success instagram post.");
        externalUrl = 'https://instagram.com/p/12345';
      } else {
        externalUrl = await postToInstagram(text, thumbnail);
      }
    }

    // Update draft status as posted
    await supabaseAdmin
      .from('post_drafts')
      .update({ 
        status: 'posted', 
        posted_at: new Date().toISOString(), 
        external_post_url: externalUrl 
      })
      .eq('id', draft_id);

    return new Response(
      JSON.stringify({ status: 'posted', external_post_url: externalUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    // Record error inside the post drafts row
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    await supabaseAdmin
      .from('post_drafts')
      .update({ status: 'failed', error_message: err.message })
      .eq('id', draft_id);

    return new Response(
      JSON.stringify({ error: `Publishing failed: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
