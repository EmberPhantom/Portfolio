import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({});
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { data } = await supabase.from('site_config').select('key, value, value_json');
    
    // Aggregate key-value pairs
    const config = {};
    data?.forEach(row => {
      config[row.key] = row.value || row.value_json;
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({});
  }
}
