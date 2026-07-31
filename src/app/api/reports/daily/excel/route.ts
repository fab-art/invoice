import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const startDate = new Date(dateStr);
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 1);

    const { data: submissions, error: fetchError } = await supabase
      .from('Submission')
      .select(`
        *,
        pharmacy:Pharmacy!pharmacyId(*),
        period:SubmissionPeriod!periodId(*),
        receivedBy:User!receivedById(fullName)
      `)
      .gte('receivedAt', startDate.toISOString())
      .lt('receivedAt', endDate.toISOString())
      .order('receivedAt', { ascending: true });

    if (fetchError) throw fetchError;
    const rows = submissions ?? [];

    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const header = ['No', 'Pharmacy Code', 'Health Facility', 'District', 'Date of Reception', 'Vouchers', 'Amount Billed (RWF)', 'Submitted By', 'Status'];

    const data = rows.map((s: any, i: number) => [
      i + 1,
      s.pharmacy.pharmacyCode,
      s.pharmacy.pharmacyName,
      s.pharmacy.district,
      s.receivedAt ? new Date(s.receivedAt).toLocaleDateString('en-GB') : '',
      s.voucherCount,
      s.invoiceTotalAmount || 0,
      s.submittedByName,
      s.status,
    ]);

    // Add totals row
    const totalVouchers = rows.reduce((sum: number, s: any) => sum + s.voucherCount, 0);
    const totalAmount = rows.reduce((sum: number, s: any) => sum + (s.invoiceTotalAmount || 0), 0);
    data.push(['', '', '', '', 'TOTAL', totalVouchers, totalAmount, '', '']);

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 35 }, { wch: 15 }, { wch: 18 },
      { wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Report');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rssb-daily-report-${dateStr}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Failed to export Excel' }, { status: 500 });
  }
}
