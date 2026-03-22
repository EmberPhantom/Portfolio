import Groq from 'groq-sdk';
import { supabase } from './supabase';

// Reuse the same Groq client pattern
let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || '';
  groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  return groqClient;
}

// ─────────────────────────────────────────────────────
// User Context Memory (stored in Supabase)
// ─────────────────────────────────────────────────────

export async function getUserContext() {
  if (!supabase) return getDefaultContext();
  try {
    const { data } = await supabase
      .from('ai_user_context')
      .select('*');
    if (!data || data.length === 0) return getDefaultContext();
    return data.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  } catch {
    return getDefaultContext();
  }
}

function getDefaultContext() {
  return {
    profile: 'Pranay Chandra, B.Tech CSE student, builds full-stack apps, AI projects, and writes technical blogs about research, projects, and events.',
  };
}

export async function updateUserContext(key, value) {
  if (!supabase) return;
  try {
    await supabase.from('ai_user_context').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  } catch (err) {
    console.warn('Failed to update AI context:', err);
  }
}

// After saving a blog, extract key facts and update AI memory
export async function updateContextFromArticle(title, content) {
  const groq = getGroqClient();
  const currentContext = await getUserContext();
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a context extractor. Given a blog article, extract any NEW personal facts about the author (Pranay Chandra) that should be remembered for future AI assistance. 
Return ONLY a compact JSON object with string keys and values. If no new info is found, return an empty object: {}
Examples: {"latest_research": "quantum computing", "attended_event": "Google I/O 2026", "current_project": "building AI portfolio"}`
        },
        {
          role: 'user',
          content: `Existing context: ${JSON.stringify(currentContext)}\n\nNew article title: "${title}"\n\nArticle content:\n${content?.substring(0, 5000)}`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    const updates = JSON.parse(completion.choices[0]?.message?.content || '{}');
    for (const [key, value] of Object.entries(updates)) {
      if (key && value) await updateUserContext(key, String(value));
    }
  } catch (err) {
    console.warn('Context update failed:', err);
  }
}

// ─────────────────────────────────────────────────────
// Core AI Writing Functions
// ─────────────────────────────────────────────────────

function buildBlogSystemPrompt(context, action) {
  const profile = context?.profile || 'a technical blog author';
  const actionPrompts = {
    improve: `You are an expert editor. The author is ${profile}. Improve the grammar, flow, and clarity of the selected text. Keep the author's voice intact. Return only the improved text, no preamble.`,
    simplify: `You are a technical writer. The author is ${profile}. Rewrite the selected text in simpler language — explain it as if to a curious non-expert. Return only the simplified text.`,
    expand: `You are a creative technical writer. The author is ${profile}. Expand the selected text into a richer, more detailed version with examples. Return only the expanded text.`,
    summarize: `You are a concise editor. The author is ${profile}. Summarize the selected text into 2-3 crisp sentences that capture the essential point. Return only the summary.`,
    generate: `You are a technical blog writer. The author is ${profile}. Write a well-structured, engaging section based on the user's prompt. Use markdown formatting (headers, bullet points, code blocks as appropriate). Return only the generated text.`,
    headline: `You are a headline specialist. The author is ${profile}. Generate 5 compelling, SEO-friendly headline options for a blog post. Return as a JSON array: { "headlines": ["...", "...", ...] }`,
  };
  return actionPrompts[action] || actionPrompts.improve;
}

async function runBlogAI(action, userText, extraContext = {}) {
  const groq = getGroqClient();
  const context = await getUserContext();
  const mergedContext = { ...context, ...extraContext };

  try {
    const isJson = action === 'headline';
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: buildBlogSystemPrompt(mergedContext, action) },
        { role: 'user', content: userText }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: action === 'generate' ? 0.8 : 0.5,
      ...(isJson ? { response_format: { type: 'json_object' } } : {}),
    });
    return completion.choices[0]?.message?.content || '';
  } catch (err) {
    if (err?.status === 429) return '⚡ AI is cooling down — try again in a moment.';
    console.warn('Blog AI error:', err);
    return null;
  }
}

export const improveWriting = (text) => runBlogAI('improve', text);
export const simplifyText = (text) => runBlogAI('simplify', text);
export const expandText = (text) => runBlogAI('expand', text);
export const summarizeText = (text) => runBlogAI('summarize', text);
export const generateSection = (prompt) => runBlogAI('generate', prompt);
export async function generateHeadlines(topic) {
  const result = await runBlogAI('headline', topic);
  try { return JSON.parse(result)?.headlines || []; } catch { return []; }
}
