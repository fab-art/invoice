import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Count submissions today
    const submittedToday = await db.submission.count({
      where: {
        receivedAt: { gte: todayStart },
      },
    });

    // Count pharmacies that have NOT submitted for the active period
    const activePeriod = await db.submissionPeriod.findFirst({
      where: { isActive: true },
    });

    let remainingPharmacies = 0;
    if (activePeriod) {
      const totalActive = await db.pharmacy.count({ where: { active: true } });
      const submittedPharmacyIds = await db.submission.findMany({
        where: { periodId: activePeriod.id },
        select: { pharmacyId: true },
        distinct: ['pharmacyId'],
      });
      remainingPharmacies = totalActive - submittedPharmacyIds.length;
    }

    // Admin stats
    const awaitingReview = await db.submission.count({ where: { status: 'SUBMITTED' } });
    const underReview = await db.submission.count({ where: { status: 'UNDER_REVIEW' } });
    const verified = await db.submission.count({ where: { status: 'VERIFIED' } });
    const paid = await db.submission.count({ where: { status: 'PAID' } });
    const totalSubmissions = await db.submission.count();

    return NextResponse.json({
      submittedToday,
      remainingPharmacies: Math.max(0, remainingPharmacies),
      totalSubmissions,
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
