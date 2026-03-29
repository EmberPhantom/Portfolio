export const dynamic = 'force-dynamic';

// Use a shared data file for caching in production/development
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';

const CACHE_PATH = path.join(process.cwd(), 'src/data/intro_cache.json');

function getCachedIntro() {
  if (fs.existsSync(CACHE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

function saveCachedIntro(intro) {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify({
    intro,
    timestamp: new Date().toISOString()
  }));
}

export async function GET() {
  const now = new Date();
  const today = now.getDay(); // 0 is Sunday
  const cache = getCachedIntro();

  // If today is Sunday and the cache was updated on a different day, regenerate.
  // Or if no cache exists.
  const needsRefresh = !cache || (today === 0 && new Date(cache.timestamp).toDateString() !== now.toDateString());

  if (!needsRefresh) {
    return NextResponse.json({ intro: cache.intro, source: 'cache' });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ intro: "Full Stack Architect & UI Engineer building systems that scale from first principles." });
  }

  const groq = new Groq({ apiKey });
  try {
    const prompt = `
      You are an AI specialized in professional persona branding for a elite Full Stack Engineer.
      The user's name is Pranay Chandra.
      Current Title: Full Stack Architect & UI Engineer.
      Context: He builds "autonomous digital environments" and "systems that scale from first principles."
      Mission: Generate a new, punchy, 1-sentence introduction that sounds sophisticated, technical, and forward-thinking.
      Avoid clichés like "passionate about." Use words like "Architecting," "Engineering," "Autonomous," "Intelligence," "First Principles."
      Return ONLY the sentence. Length should be between 10-15 words.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const intro = (completion.choices[0]?.message?.content || "Full Stack Architect & UI Engineer building systems that scale from first principles.").replace(/"/g, '');
    
    saveCachedIntro(intro);

    return NextResponse.json({ intro, source: 'intelligence-sync' });
  } catch (error) {
    return NextResponse.json({ intro: cache?.intro || "Full Stack Architect & UI Engineer building systems that scale from first principles." });
  }
}
