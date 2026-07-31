import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data: submission, error } = await supabase
      .from('Submission')
      .select(`
        *,
        pharmacy:Pharmacy!pharmacyId(*),
        period:SubmissionPeriod!periodId(*),
        receivedBy:User!receivedById(id, fullName)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Navy color
    const navy: [number, number, number] = [27, 42, 107];
    const gold: [number, number, number] = [245, 166, 35];

    // Header bar
    doc.setFillColor(...navy);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // RSSB Logo placeholder text (logo would need to be embedded as base64)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RSSB', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Rwanda Social Security Board', 15, 28);

    // Department title
    doc.setTextColor(...navy);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PHARMACEUTICAL INVOICES VERIFICATION UNIT', pageWidth / 2, 48, { align: 'center' });

    // Title
    doc.setFontSize(16);
    doc.setTextColor(...gold);
    doc.text('INVOICE RECEPTION RECEIPT', pageWidth / 2, 58, { align: 'center' });

    // Divider line
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.5);
    doc.line(15, 63, pageWidth - 15, 63);

    // Receipt info section
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const receiptDate = submission.receivedAt
      ? new Date(submission.receivedAt).toLocaleString('en-GB', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })
      : 'N/A';

    doc.text(`Receipt No: ${submission.receiptNumber}`, 15, 72);
    doc.text(`Date: ${receiptDate}`, pageWidth - 15, 72, { align: 'right' });

    // Main details table
    const tableData = [
      ['Pharmacy Name', submission.pharmacy.pharmacyName],
      ['Pharmacy Code', submission.pharmacy.pharmacyCode],
      ['District', submission.pharmacy.district],
      ['Submission Period', submission.period.label],
      ['Number of Vouchers', String(submission.voucherCount)],
      ['Total Amount Billed (RWF)', submission.invoiceTotalAmount ? `${submission.invoiceTotalAmount.toLocaleString()} RWF` : 'N/A'],
      ['Submitted By', submission.submittedByName],
      ['Position', submission.submittedByPosition || 'N/A'],
      ['Received By', submission.receivedBy.fullName || 'N/A'],
    ];

    (doc as any).autoTable({
      startY: 80,
      head: [['Field', 'Details']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: navy,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' },
      },
      margin: { left: 15, right: 15 },
    });

    // Signature section
    const sigY = (doc as any).lastAutoTable.finalY + 30;

    doc.setTextColor(...navy);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorization', pageWidth / 2, sigY, { align: 'center' });

    // Draw signature lines
    const lineY = sigY + 40;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    // Receptionist signature
    doc.line(20, lineY, 90, lineY);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('RSSB Receptionist', 55, lineY + 5, { align: 'center' });
    doc.text(`Name: ${submission.receivedBy.fullName || '_______________'}`, 55, lineY + 11, { align: 'center' });

    // Pharmacy representative signature
    doc.line(pageWidth - 90, lineY, pageWidth - 20, lineY);
    doc.text('Pharmacy Representative', pageWidth - 55, lineY + 5, { align: 'center' });
    doc.text('Name: _______________', pageWidth - 55, lineY + 11, { align: 'center' });

    // Stamp placeholder
    const stampY = lineY - 15;
    doc.setDrawColor(...navy);
    doc.setLineWidth(1);
    doc.circle(pageWidth - 55, stampY, 18);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navy);
    doc.text('RSSB', pageWidth - 55, stampY - 2, { align: 'center' });
    doc.setFontSize(5);
    doc.text('OFFICIAL STAMP', pageWidth - 55, stampY + 4, { align: 'center' });

    // Disclaimer
    const disclaimerY = lineY + 30;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'italic');
    const disclaimer = 'This receipt acknowledges the reception of pharmaceutical invoices for verification. ' +
      'The amounts stated are as declared by the pharmacy and are subject to verification by RSSB. ' +
      'This document does not constitute a guarantee of payment.';
    const lines = doc.splitTextToSize(disclaimer, pageWidth - 30);
    doc.text(lines, pageWidth / 2, disclaimerY, { align: 'center' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFillColor(...navy);
    doc.rect(0, footerY - 5, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('RSSB - Pharmaceutical Invoices Verification Unit', pageWidth / 2, footerY + 3, { align: 'center' });
    doc.text('Kigali, Rwanda | www.rssb.rw', pageWidth / 2, footerY + 9, { align: 'center' });

    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="receipt-${submission.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
