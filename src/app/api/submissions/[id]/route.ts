import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
      if (status === 'UNDER_REVIEW' || status === 'VERIFIED' || status === 'REJECTED' || status === 'PAID') {
        updateData.verifiedById = session.userId;
        updateData.verifiedAt = new Date().toISOString();
      }
      if (status === 'PAID') {
        updateData.paidAt = paidAt ? new Date(paidAt).toISOString() : new Date().toISOString();
        if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);
        if (paymentId) updateData.paymentId = paymentId;
      }
    }
    if (notes !== undefined) updateData.notes = notes;
    if (paymentId) updateData.paymentId = paymentId;
    if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount);

    const { data: submission, error } = await supabase
      .from('Submission')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        pharmacy:Pharmacy!pharmacyId(*),
        period:SubmissionPeriod!periodId(*),
        receivedBy:User!receivedById(id, fullName),
        verifiedBy:User!verifiedById(id, fullName)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Submission update error:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
