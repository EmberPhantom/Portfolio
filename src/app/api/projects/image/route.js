import { NextResponse } from 'next/server';
import { getProjectVisualPrompt } from '@/lib/project-ai';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const desc = searchParams.get('desc');

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  try {
    // Generate a great visual keyword using AI
    const keyword = await getProjectVisualPrompt(name, desc);
    
    // Query Unsplash's public NAPi search endpoint (no api key required)
    const unsplashRes = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(keyword)}&per_page=3`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }
    );

    if (unsplashRes.ok) {
      const data = await unsplashRes.json();
      const results = data.results;
      if (results && results.length > 0) {
        const imageUrl = results[0].urls?.regular || results[0].urls?.full;
        if (imageUrl) {
          return NextResponse.json({ keyword, imageUrl });
        }
      }
    }
  } catch (err) {
    console.error('Dynamic image fetch failed:', err);
  }

  // Fallback default
  return NextResponse.json({
    keyword: 'technology',
    imageUrl: `https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop`
  });
}
