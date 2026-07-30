import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get('periodId');

    const where: any = {};
    if (periodId) {
      where.periodId = periodId;
    }

    const submissions = await db.submission.findMany({
      where,
      include: {
        pharmacy: true,
        period: true,
        receivedBy: { select: { fullName: true } },
      },
      orderBy: { receivedAt: 'asc' },
    });

    const totals = {
      submissions: submissions.length,
      vouchers: submissions.reduce((sum, s) => sum + s.voucherCount, 0),
      amount: submissions.reduce((sum, s) => sum + (s.invoiceTotalAmount || 0), 0),
    };

    return NextResponse.json({ submissions, totals, periodId });
  } catch (error) {
    console.error('Monthly report error:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly report' }, { status: 500 });
  }
}
