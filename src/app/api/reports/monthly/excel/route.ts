import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodId = searchParams.get('periodId');

    const where: any = {};
    if (periodId) where.periodId = periodId;

    const submissions = await db.submission.findMany({
      where,
      include: {
        pharmacy: true,
        period: true,
        receivedBy: { select: { fullName: true } },
      },
      orderBy: { receivedAt: 'asc' },
    });

    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const header = ['No', 'Pharmacy Code', 'Health Facility', 'District', 'Date of Reception', 'Vouchers', 'Amount Billed (RWF)', 'Submitted By', 'Status', 'Payment ID', 'Paid Amount'];

    const data = submissions.map((s, i) => [
      i + 1,
      s.pharmacy.pharmacyCode,
      s.pharmacy.pharmacyName,
      s.pharmacy.district,
      s.receivedAt ? new Date(s.receivedAt).toLocaleDateString('en-GB') : '',
      s.voucherCount,
      s.invoiceTotalAmount || 0,
      s.submittedByName,
      s.status,
      s.paymentId || '',
      s.paidAmount || '',
    ]);

    const totalVouchers = submissions.reduce((sum, s) => sum + s.voucherCount, 0);
    const totalAmount = submissions.reduce((sum, s) => sum + (s.invoiceTotalAmount || 0), 0);
    data.push(['', '', '', '', 'TOTAL', totalVouchers, totalAmount, '', '', '', '']);

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 35 }, { wch: 15 }, { wch: 18 },
      { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Report');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rssb-monthly-report-${periodId || 'all'}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Monthly Excel export error:', error);
    return NextResponse.json({ error: 'Failed to export Excel' }, { status: 500 });
  }
}
