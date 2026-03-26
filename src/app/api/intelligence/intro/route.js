import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;
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

    const intro = completion.choices[0]?.message?.content || "Full Stack Architect & UI Engineer building systems that scale from first principles.";

    return NextResponse.json({ intro: intro.replace(/"/g, '') });
  } catch (error) {
    return NextResponse.json({ intro: "Full Stack Architect & UI Engineer building systems that scale from first principles." });
  }
}
