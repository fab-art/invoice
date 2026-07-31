import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get('periodId');

    let query = supabase
      .from('Submission')
      .select(`
        *,
        pharmacy:Pharmacy!pharmacyId(*),
        period:SubmissionPeriod!periodId(*),
        receivedBy:User!receivedById(fullName)
      `)
      .order('receivedAt', { ascending: true });

    if (periodId) {
      query = query.eq('periodId', periodId);
    }

    const { data: submissions, error } = await query;
    if (error) throw error;

    const rows = submissions ?? [];
    const totals = {
      submissions: rows.length,
      vouchers: rows.reduce((sum: number, s: any) => sum + s.voucherCount, 0),
      amount: rows.reduce((sum: number, s: any) => sum + (s.invoiceTotalAmount || 0), 0),
    };

    return NextResponse.json({ submissions: rows, totals, periodId });
  } catch (error) {
    console.error('Monthly report error:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly report' }, { status: 500 });
  }
}
