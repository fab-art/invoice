import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const periods = await db.submissionPeriod.findMany({
      orderBy: { startDate: 'desc' },
    });
    return NextResponse.json(periods);
  } catch (error) {
    console.error('Periods fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
  }
}
