// Builds pre-filled email drafts that hand off to the user's default mail
// client (Outlook, in most RSSB desktop setups). Browsers cannot attach a
// file to a mailto: link directly, so the flow is: (1) generate/download the
// relevant file, (2) open a mailto draft with subject + body already written,
// (3) the user attaches the just-downloaded file before hitting send.

export function openMailDraft({ to = '', cc = '', subject = '', body = '' }) {
  const params = new URLSearchParams()
  if (cc) params.set('cc', cc)
  params.set('subject', subject)
  params.set('body', body)
  const url = `mailto:${encodeURIComponent(to)}?${params.toString()}`
  window.location.href = url
}

export function buildPharmacyReceiptEmail({ submission, pharmacy, receivedByName }) {
  const subject = `RSSB Reception Receipt ${submission.receipt_number} - ${pharmacy.pharmacy_name}`
  const body = [
    `Dear ${pharmacy.contact_person || `${pharmacy.pharmacy_name} team`},`,
    '',
    `This confirms that RSSB Pharmaceutical Invoices Verification Unit received your submission today.`,
    '',
    `Receipt No.: ${submission.receipt_number}`,
    `Pharmacy: ${pharmacy.pharmacy_name} (${pharmacy.pharmacy_code})`,
    `District: ${pharmacy.district}`,
    `Vouchers submitted: ${submission.voucher_count}`,
    submission.invoice_total_amount != null ? `Invoice total: ${Number(submission.invoice_total_amount).toLocaleString()} RWF` : null,
    `Received by: ${receivedByName || '-'}`,
    '',
    'The signed reception receipt is attached to this email for your records.',
    '',
    'Kind regards,',
    'RSSB Pharmaceutical Invoices Verification Unit',
  ].filter(Boolean).join('\n')
  return {
    to: pharmacy.email || '',
    subject,
    body,
  }
}

export function buildSupervisorReportEmail({ date, rows, totals }) {
  const subject = `Reception Report - ${date}`
  const body = [
    `Dear Supervisor,`,
    '',
    `Please find attached the Pharmaceutical Invoices Verification Unit reception report for ${date}.`,
    '',
    'Summary:',
    `- Submissions received: ${rows.length}`,
    `- Total vouchers: ${totals.vouchers}`,
    `- Total invoice amount: ${totals.amount.toLocaleString()} RWF`,
    '',
    'The full breakdown by pharmacy is in the attached Excel report.',
    '',
    'Kind regards,',
    'RSSB Reception Desk',
  ].join('\n')
  return { to: '', subject, body }
}
