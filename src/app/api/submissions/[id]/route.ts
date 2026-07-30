import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = NextResponse.next();
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { status, notes, paymentId, paidAmount, paidAt } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'UNDER_REVIEW' || status === 'VERIFIED' || status === 'REJECTED' || status === 'PAID') {
        updateData.verifiedById = session.userId;
        updateData.verifiedAt = new Date();
      }
      if (status === 'PAID') {
        updateData.paidAt = paidAt ? new Date(paidAt) : new Date();
        if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);
        if (paymentId) updateData.paymentId = paymentId;
      }
    }
    if (notes !== undefined) updateData.notes = notes;
    if (paymentId) updateData.paymentId = paymentId;
    if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);

    const submission = await db.submission.update({
      where: { id },
      data: updateData,
      include: {
        pharmacy: true,
        period: true,
        receivedBy: { select: { id: true, fullName: true } },
        verifiedBy: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Submission update error:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
