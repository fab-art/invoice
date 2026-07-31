import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('SubmissionPeriod')
      .select('*')
      .order('startDate', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Periods fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
  }
}
