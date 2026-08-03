import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sessionOptions, SessionData } from '@/lib/session';
import { getIronSession } from 'iron-session';

const SUBMISSION_SELECT = `
  *,
  pharmacy:Pharmacy!pharmacyId(*),
  period:SubmissionPeriod!periodId(*),
  receivedBy:User!receivedById(id, fullName, role),
  verifiedBy:User!verifiedById(id, fullName)
`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const periodId = searchParams.get('periodId');

    let query = supabase
      .from('Submission')
      .select(SUBMISSION_SELECT)
      .order('receivedAt', { ascending: false })
      .limit(200);

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }
    if (startDate && endDate) {
      query = query.gte('receivedAt', new Date(startDate).toISOString()).lte('receivedAt', new Date(endDate).toISOString());
    }
    if (periodId) {
      query = query.eq('periodId', periodId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
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

    const { count: todayCount, error: countError } = await supabase
      .from('Submission')
      .select('*', { count: 'exact', head: true })
      .gte('receivedAt', todayStart.toISOString())
      .lt('receivedAt', todayEnd.toISOString());

    if (countError) throw countError;

    const sequence = String((todayCount ?? 0) + 1).padStart(5, '0');
    const receiptNumber = `RSSB-${dateStr}-${sequence}`;

    const { data: submission, error } = await supabase
      .from('Submission')
      .insert({
        receiptNumber,
        pharmacyId,
        periodId,
        voucherCount: parseInt(voucherCount),
        invoiceTotalAmount: parseFloat(invoiceTotalAmount) || 0,
        submittedByName,
        submittedByPosition: submittedByPosition || '',
        receivedById: session.userId,
        receivedAt: new Date().toISOString(),
      })
      .select(`
        *,
        pharmacy:Pharmacy!pharmacyId(*),
        period:SubmissionPeriod!periodId(*),
        receivedBy:User!receivedById(id, fullName, role)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Submission create error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
