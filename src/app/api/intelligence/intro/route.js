import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({
      intro: "Full Stack Architect & UI Engineer building systems that scale from first principles."
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'homepage.hero_subtitle')
      .single();

    const intro = data?.value || "Full Stack Architect & UI Engineer building systems that scale from first principles.";
    return NextResponse.json({ intro });
  } catch (error) {
    return NextResponse.json({
      intro: "Full Stack Architect & UI Engineer building systems that scale from first principles."
    });
  }
}
