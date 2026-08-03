/**
 * Receipt Component - Print-ready receipt for pharmacy submissions
 * 
 * Displays submission details in a formatted, printable layout.
 * Used for generating PDF receipts and print previews.
 */
import { forwardRef } from 'react'
import dayjs from 'dayjs'

interface Submission {
  receipt_number: string
  received_at: string
  voucher_count: number
  invoice_total_amount?: number | null
  submitted_by_name?: string | null
  submitted_by_position?: string | null
  submitted_by_contact?: string | null
  requirements_notes?: string | null
  req_signed_vouchers?: boolean
  req_summary_sheet?: boolean
  req_stamped_invoice?: boolean
  req_prescription_copies?: boolean
  req_bank_details?: boolean
}

interface Pharmacy {
  pharmacy_name: string
  pharmacy_code: string
  district: string
}

interface ReceiptProps {
  submission: Submission
  pharmacy: Pharmacy
  receivedByName?: string
}

const REQ_LABELS: Record<string, string> = {
  req_signed_vouchers: 'Signed vouchers',
  req_summary_sheet: 'Summary sheet',
  req_stamped_invoice: 'Stamped invoice',
  req_prescription_copies: 'Prescription copies',
  req_bank_details: 'Bank details',
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(function Receipt({ submission, pharmacy, receivedByName }, ref) {
  if (!submission || !pharmacy) return null
  
  const hasSubmitter = submission.submitted_by_name || submission.submitted_by_position || submission.submitted_by_contact
  
  return (
    <div ref={ref} className="receipt-print">
      <div className="receipt-seal">Received<br/>RSSB</div>
      <div className="receipt-header">
        <img src="/rssb-logo.png" alt="RSSB" />
        <h2>Rwanda Social Security Board</h2>
        <h3>Pharmaceutical Invoice Reception Receipt</h3>
      </div>
      <table className="receipt-meta">
        <tbody>
          <tr><td>Receipt No.</td><td>{submission.receipt_number}</td></tr>
          <tr><td>Date &amp; Time</td><td>{dayjs(submission.received_at).format('DD/MM/YYYY HH:mm')}</td></tr>
          <tr><td>Pharmacy</td><td>{pharmacy.pharmacy_name}</td></tr>
          <tr><td>Pharmacy Code</td><td>{pharmacy.pharmacy_code}</td></tr>
          <tr><td>District</td><td>{pharmacy.district}</td></tr>
          <tr><td>Vouchers Submitted</td><td>{submission.voucher_count}</td></tr>
          {submission.invoice_total_amount != null && (
            <tr><td>Invoice Total</td><td>{Number(submission.invoice_total_amount).toLocaleString()} RWF</td></tr>
          )}
        </tbody>
      </table>

      {hasSubmitter && (
        <>
          <h4>Submitted By</h4>
          <table className="receipt-meta">
            <tbody>
              {submission.submitted_by_name && (
                <tr><td>Name</td><td>{submission.submitted_by_name}</td></tr>
              )}
              {submission.submitted_by_position && (
                <tr><td>Position</td><td>{submission.submitted_by_position}</td></tr>
              )}
              {submission.submitted_by_contact && (
                <tr><td>Contact</td><td>{submission.submitted_by_contact}</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}

      <h4>Requirements Confirmed</h4>
      <ul className="receipt-req-list">
        {Object.entries(REQ_LABELS).map(([key, label]) => (
          <li key={key}>{submission[key] ? '☑' : '☐'} {label}</li>
        ))}
      </ul>
      {submission.requirements_notes && (
        <p className="receipt-notes">Notes: {submission.requirements_notes}</p>
      )}
      <div className="receipt-footer">
        <div>Received by: {receivedByName || '—'}</div>
        <div className="receipt-signatures">
          <div>__________________________<br/>Receptionist signature</div>
          <div>__________________________<br/>Pharmacy representative signature</div>
        </div>
      </div>
      <p className="receipt-disclaimer">
        This receipt confirms that the above documents were physically received by RSSB on the date shown.
        It does not constitute confirmation of verification or payment.
      </p>
    </div>
  )
})

export default Receipt
