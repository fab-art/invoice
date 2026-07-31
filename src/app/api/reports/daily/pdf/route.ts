import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().slice(0, 10);

    const startDate = new Date(dateStr);
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 1);

    const { data: submissionsData, error: fetchError } = await supabase
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
    const submissions = submissionsData ?? [];

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
    const formattedDate = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.text(`RECEPTION REPORT - ${formattedDate}`, pageWidth / 2, 40, { align: 'center' });

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
    ]);

    // Totals row
    const totalVouchers = submissions.reduce((sum, s) => sum + s.voucherCount, 0);
    const totalAmount = submissions.reduce((sum, s) => sum + (s.invoiceTotalAmount || 0), 0);
    tableData.push(['', '', '', '', 'TOTAL', totalVouchers, totalAmount.toLocaleString(), '', '']);

    (doc as any).autoTable({
      startY: 50,
      head: [['No', 'Code', 'Health Facility', 'District', 'Date', 'Vouchers', 'Amount (RWF)', 'Submitted By', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [27, 42, 107],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 7,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 45 },
        3: { cellWidth: 22 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
        7: { cellWidth: 35 },
        8: { cellWidth: 20 },
      },
      margin: { left: 10, right: 10 },
    });

    // Summary
    const summaryY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(27, 42, 107);
    doc.text(`Total Submissions: ${submissions.length}`, 15, summaryY);
    doc.text(`Total Vouchers: ${totalVouchers}`, 15, summaryY + 8);
    doc.text(`Total Amount: ${totalAmount.toLocaleString()} RWF`, 15, summaryY + 16);

    // Generated timestamp
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    doc.text(`Report generated on ${new Date().toLocaleString('en-GB')}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 15, { align: 'right' });

    const pdfBuffer = doc.output('arraybuffer');
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rssb-daily-report-${dateStr}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Daily PDF report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
