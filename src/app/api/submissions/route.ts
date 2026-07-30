import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const periodId = searchParams.get('periodId');

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (startDate && endDate) {
      where.receivedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (periodId) {
      where.periodId = periodId;
    }

    const submissions = await db.submission.findMany({
      where,
      include: {
        pharmacy: true,
        period: true,
        receivedBy: { select: { id: true, fullName: true, role: true } },
        verifiedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { receivedAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { pharmacyId, periodId, voucherCount, invoiceTotalAmount, submittedByName, submittedByPosition } = body;

    if (!pharmacyId || !periodId || !voucherCount || !submittedByName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate receipt number: RSSB-YYYYMMDD-#####
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Count submissions today to get sequence number
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayCount = await db.submission.count({
      where: {
        receivedAt: { gte: todayStart, lt: todayEnd },
      },
    });

    const sequence = String(todayCount + 1).padStart(5, '0');
    const receiptNumber = `RSSB-${dateStr}-${sequence}`;

    const submission = await db.submission.create({
      data: {
        receiptNumber,
        pharmacyId,
        periodId,
        voucherCount: parseInt(voucherCount),
        invoiceTotalAmount: parseFloat(invoiceTotalAmount) || 0,
        submittedByName,
        submittedByPosition: submittedByPosition || '',
        receivedById: session.userId,
        receivedAt: new Date(),
      },
      include: {
        pharmacy: true,
        period: true,
        receivedBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Submission create error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
