import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const startDate = new Date(dateStr);
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 1);

    const { data: submissions, error } = await supabase
      .from('Submission')
      .select(`
        *,
        pharmacy:Pharmacy!pharmacyId(*),
        period:SubmissionPeriod!periodId(*),
        receivedBy:User!receivedById(fullName)
      `)
      .gte('receivedAt', startDate.toISOString())
      .lt('receivedAt', endDate.toISOString())
      .order('receivedAt', { ascending: true });

    if (error) throw error;

    const rows = submissions ?? [];
    const totals = {
      submissions: rows.length,
      vouchers: rows.reduce((sum: number, s: any) => sum + s.voucherCount, 0),
      amount: rows.reduce((sum: number, s: any) => sum + (s.invoiceTotalAmount || 0), 0),
    };

    return NextResponse.json({ date: dateStr, submissions: rows, totals });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily report' }, { status: 500 });
  }
}
