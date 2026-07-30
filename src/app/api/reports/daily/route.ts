import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const startDate = new Date(dateStr);
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 1);

    const submissions = await db.submission.findMany({
      where: {
        receivedAt: { gte: startDate, lt: endDate },
      },
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

    return NextResponse.json({ date: dateStr, submissions, totals });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json({ error: 'Failed to fetch daily report' }, { status: 500 });
  }
}
