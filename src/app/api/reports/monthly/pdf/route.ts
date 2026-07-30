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

    const period = periodId ? await db.submissionPeriod.findUnique({ where: { id: periodId } }) : null;

    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(27, 42, 107);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RSSB - Rwanda Social Security Board', 15, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Pharmaceutical Invoices Verification Unit', 15, 23);

    // Report title
    doc.setTextColor(27, 42, 107);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const periodLabel = period ? period.label : 'All Periods';
    doc.text(`MONTHLY REPORT - ${periodLabel}`, pageWidth / 2, 40, { align: 'center' });

    if (period) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const from = new Date(period.startDate).toLocaleDateString('en-GB');
      const to = new Date(period.endDate).toLocaleDateString('en-GB');
      doc.text(`Period: ${from} to ${to}`, pageWidth / 2, 47, { align: 'center' });
    }

    // Table
    const tableData = submissions.map((s, i) => [
      i + 1,
      s.pharmacy.pharmacyCode,
      s.pharmacy.pharmacyName,
      s.pharmacy.district,
      s.receivedAt ? new Date(s.receivedAt).toLocaleDateString('en-GB') : '',
      s.voucherCount,
      s.invoiceTotalAmount ? `${s.invoiceTotalAmount.toLocaleString()}` : '0',
      s.submittedByName,
      s.status,
      s.paymentId || '',
      s.paidAmount ? `${s.paidAmount.toLocaleString()}` : '',
    ]);

    const totalVouchers = submissions.reduce((sum, s) => sum + s.voucherCount, 0);
    const totalAmount = submissions.reduce((sum, s) => sum + (s.invoiceTotalAmount || 0), 0);
    const totalPaid = submissions.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    tableData.push(['', '', '', '', 'TOTAL', totalVouchers, totalAmount.toLocaleString(), '', '', '', totalPaid.toLocaleString()]);

    (doc as any).autoTable({
      startY: period ? 55 : 50,
      head: [['No', 'Code', 'Health Facility', 'District', 'Date', 'Vouchers', 'Amount (RWF)', 'Submitted By', 'Status', 'Payment ID', 'Paid (RWF)']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [27, 42, 107],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      styles: {
        fontSize: 6,
        cellPadding: 2,
      },
      margin: { left: 8, right: 8 },
    });

    // Summary
    const summaryY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 42, 107);
    doc.text(`Total Submissions: ${submissions.length}`, 15, summaryY);
    doc.text(`Total Vouchers: ${totalVouchers}`, 15, summaryY + 8);
    doc.text(`Total Amount Billed: ${totalAmount.toLocaleString()} RWF`, 15, summaryY + 16);
    doc.text(`Total Paid: ${totalPaid.toLocaleString()} RWF`, 15, summaryY + 24);

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.text(`Report generated on ${new Date().toLocaleString('en-GB')}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 15, { align: 'right' });

    const pdfBuffer = doc.output('arraybuffer');
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rssb-monthly-report-${periodId || 'all'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Monthly PDF report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
