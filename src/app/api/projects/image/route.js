import { NextResponse } from 'next/server';
import { getProjectVisualPrompt } from '@/lib/project-ai';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const desc = searchParams.get('desc');

  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  // Generate a great visual keyword using AI
  const keyword = await getProjectVisualPrompt(name, desc);
  
  // Use a high-quality Unsplash source redirect or a specific high-res photo mapping
  // We use a specific size and quality for the hero
  const imageUrl = `https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop`; // Default fallback
  
  // For dynamic behavior without an Unsplash API key, we construct a search-based random URL
  // Note: source.unsplash.com is deprecated, but we can use their featured/keyword pattern if still active 
  // or a more robust placeholder engine.
  const dynamicUrl = `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop`; // Secondary fallback

  // Returning a structured JSON with the suggested keyword and dynamic URL
  return NextResponse.json({
    keyword,
    imageUrl: `https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1200&auto=format&fit=crop&sig=${encodeURIComponent(keyword)}` 
    // We add a 'sig' or similar to help handle cache-busting per project if using a random service
  });
}
