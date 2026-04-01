import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const groq = apiKey ? new Groq({ apiKey }) : null;

export async function POST(request) {
  if (!groq) {
    return NextResponse.json({ error: 'AI Engine not configured on server.' }, { status: 503 });
  }

  try {
    const { messages, model, temperature } = await request.json();

    const completion = await groq.chat.completions.create({
      model: model || 'llama-3.3-70b-versatile',
      messages,
      temperature: temperature ?? 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Groq API Error:', error);
    return NextResponse.json({ 
      error: error.message,
      status: error.status || 500 
    }, { status: error.status || 500 });
  }
}
