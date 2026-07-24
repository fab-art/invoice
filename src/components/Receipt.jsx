import { forwardRef } from 'react'
import dayjs from 'dayjs'

const REQ_LABELS = {
  req_signed_vouchers: 'Signed vouchers',
  req_summary_sheet: 'Summary sheet',
  req_stamped_invoice: 'Stamped invoice',
  req_prescription_copies: 'Prescription copies',
  req_bank_details: 'Bank details',
}

const Receipt = forwardRef(function Receipt({ submission, pharmacy, receivedByName }, ref) {
  if (!submission || !pharmacy) return null
  return (
    <div ref={ref} className="receipt-print">
      <div className="receipt-header">
        <h2>RSSB</h2>
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
