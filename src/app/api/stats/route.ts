import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Count submissions today
    const { count: submittedToday, error: submittedTodayError } = await supabase
      .from('Submission')
      .select('*', { count: 'exact', head: true })
      .gte('receivedAt', todayStart.toISOString());
    if (submittedTodayError) throw submittedTodayError;

    // Count pharmacies that have NOT submitted for the active period
    const { data: activePeriods, error: periodError } = await supabase
      .from('SubmissionPeriod')
      .select('*')
      .eq('isActive', true)
      .limit(1);
    if (periodError) throw periodError;
    const activePeriod = activePeriods?.[0] ?? null;

    let remainingPharmacies = 0;
    if (activePeriod) {
      const { count: totalActive, error: totalActiveError } = await supabase
        .from('Pharmacy')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      if (totalActiveError) throw totalActiveError;

      const { data: subs, error: subsError } = await supabase
        .from('Submission')
        .select('pharmacyId')
        .eq('periodId', activePeriod.id);
      if (subsError) throw subsError;

      const distinctPharmacyIds = new Set((subs ?? []).map((s: { pharmacyId: string }) => s.pharmacyId));
      remainingPharmacies = (totalActive ?? 0) - distinctPharmacyIds.size;
    }

    // Admin stats
    const countByStatus = async (status: string) => {
      const { count, error } = await supabase
        .from('Submission')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      if (error) throw error;
      return count ?? 0;
    };

    const awaitingReview = await countByStatus('SUBMITTED');
    const underReview = await countByStatus('UNDER_REVIEW');
    const verified = await countByStatus('VERIFIED');
    const paid = await countByStatus('PAID');

    const { count: totalSubmissions, error: totalError } = await supabase
      .from('Submission')
      .select('*', { count: 'exact', head: true });
    if (totalError) throw totalError;

    return NextResponse.json({
      submittedToday: submittedToday ?? 0,
      remainingPharmacies: Math.max(0, remainingPharmacies),
      totalSubmissions: totalSubmissions ?? 0,
      awaitingReview,
      underReview,
      verified,
      paid,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
