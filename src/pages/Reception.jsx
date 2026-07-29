import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useAuth } from '../lib/AuthContext.jsx'
import PharmacySearch from '../components/PharmacySearch.jsx'
import Receipt from '../components/Receipt.jsx'
import { openMailDraft, buildPharmacyReceiptEmail } from '../lib/email'
import {
  listPharmacies, getActivePeriod, createSubmission,
  countSubmissionsSince, getRemainingPharmacyCount,
} from '../lib/localDb'

const REQUIREMENTS = [
  { key: 'req_signed_vouchers', label: 'Signed vouchers' },
  { key: 'req_summary_sheet', label: 'Summary sheet' },
  { key: 'req_stamped_invoice', label: 'Stamped invoice' },
  { key: 'req_prescription_copies', label: 'Prescription copies' },
  { key: 'req_bank_details', label: 'Bank details' },
]

export default function Reception() {
  const { profile } = useAuth()
  const [pharmacies, setPharmacies] = useState([])
  const [period, setPeriod] = useState(null)
  const [selected, setSelected] = useState(null)
  const [voucherCount, setVoucherCount] = useState('')
  const [invoiceTotal, setInvoiceTotal] = useState('')
  const [checks, setChecks] = useState({})
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSubmission, setLastSubmission] = useState(null)
  const [lastPharmacy, setLastPharmacy] = useState(null)
  const [todayCount, setTodayCount] = useState(0)
  const [remainingCount, setRemainingCount] = useState(null)
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [emailNotice, setEmailNotice] = useState('')
  const printRef = useRef(null)

  const handlePrint = useReactToPrint({ contentRef: printRef })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [pharms, activePeriod] = await Promise.all([
      listPharmacies({ activeOnly: true }),
      getActivePeriod(),
    ])
    setPharmacies(pharms)
    setPeriod(activePeriod)
    refreshCounts(activePeriod)
  }

  async function refreshCounts(activePeriod) {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const [today, remaining] = await Promise.all([
      countSubmissionsSince(startOfDay.toISOString()),
      getRemainingPharmacyCount(activePeriod?.id),
    ])
    setTodayCount(today)
    setRemainingCount(remaining)
  }

  function resetForm() {
    setSelected(null)
    setVoucherCount('')
    setInvoiceTotal('')
    setChecks({})
    setNotes('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!selected) { setError('Please select a pharmacy.'); return }
    if (!voucherCount || Number(voucherCount) <= 0) { setError('Enter a valid voucher count.'); return }

    setSaving(true)
    try {
      const payload = {
        pharmacy_id: selected.id,
        period_id: period?.id || null,
        voucher_count: Number(voucherCount),
        invoice_total_amount: invoiceTotal ? Number(invoiceTotal) : null,
        req_signed_vouchers: !!checks.req_signed_vouchers,
        req_summary_sheet: !!checks.req_summary_sheet,
        req_stamped_invoice: !!checks.req_stamped_invoice,
        req_prescription_copies: !!checks.req_prescription_copies,
        req_bank_details: !!checks.req_bank_details,
        requirements_notes: notes || null,
        received_by: profile?.id,
        received_by_name: profile?.full_name,
      }

      const record = await createSubmission(payload)
      setLastSubmission(record)
      setLastPharmacy(selected)
      refreshCounts(period)
      setTimeout(() => handlePrint(), 200)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  function handleEmailPharmacy() {
    if (!lastSubmission || !lastPharmacy) return
    const draft = buildPharmacyReceiptEmail({
      submission: lastSubmission,
      pharmacy: lastPharmacy,
      receivedByName: profile?.full_name,
    })
    setEmailNotice(
      `An Outlook draft is opening for ${lastPharmacy.pharmacy_name}. Use Print Preview to save the receipt as a PDF first, then attach it to the draft before sending.`
    )
    openMailDraft(draft)
  }

  return (
    <div className="reception-page">
      <div className="reception-stats">
        <div className="stat-card">
          <span className="stat-value">{todayCount}</span>
          <span className="stat-label">Submitted today</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{remainingCount ?? '—'}</span>
          <span className="stat-label">Pharmacies remaining ({period?.label || 'current period'})</span>
        </div>
      </div>

      <form className="reception-form" onSubmit={handleSubmit}>
        <h2>New Submission</h2>
        {error && <div className="alert-error">{error}</div>}

        <PharmacySearch pharmacies={pharmacies} onSelect={setSelected} selected={selected} />

        {selected && (
          <div className="pharmacy-summary">
            District: {selected.district} {selected.sector ? `· ${selected.sector}` : ''} {selected.contact_person ? `· Contact: ${selected.contact_person}` : ''}
          </div>
        )}

        <div className="form-row">
          <div>
            <label>Number of vouchers submitted</label>
            <input type="number" min="1" value={voucherCount} onChange={e => setVoucherCount(e.target.value)} required />
          </div>
          <div>
            <label>Invoice total (RWF, optional)</label>
            <input type="number" min="0" value={invoiceTotal} onChange={e => setInvoiceTotal(e.target.value)} />
          </div>
        </div>

        <h3>Requirements Checklist</h3>
        <div className="checklist">
          {REQUIREMENTS.map(r => {
            const active = !!checks[r.key]
            return (
              <button
                type="button"
                key={r.key}
                className={`checklist-btn${active ? ' active' : ''}`}
                aria-pressed={active}
                onClick={() => setChecks(c => ({ ...c, [r.key]: !c[r.key] }))}
              >
                <span className="dot">{active ? '✓' : ''}</span>
                {r.label}
              </button>
            )
          })}
        </div>

        <label>Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={resetForm}>Clear</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Confirm & Print Receipt'}
          </button>
        </div>
      </form>

      {lastSubmission && (
        <div className="last-receipt-actions">
          <p>Receipt <strong>{lastSubmission.receipt_number}</strong> generated for <strong>{lastPharmacy?.pharmacy_name}</strong>.</p>
          <div className="actions-cell">
            <button className="btn-secondary" onClick={() => setShowPreview(true)}>Print Preview</button>
            <button className="btn-link" onClick={() => handlePrint()}>Print again</button>
            <button className="btn-gold" onClick={handleEmailPharmacy}>Email Receipt to Pharmacy</button>
          </div>
        </div>
      )}

      {emailNotice && <div className="alert-info">{emailNotice}</div>}

      {showPreview && lastSubmission && (
        <div className="modal-backdrop" onClick={() => setShowPreview(false)}>
          <div className="modal-card modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>Print Preview</h3>
              <button className="modal-close" onClick={() => setShowPreview(false)}>✕</button>
            </div>
            <div className="print-preview-frame">
              <Receipt submission={lastSubmission} pharmacy={lastPharmacy} receivedByName={profile?.full_name} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowPreview(false)}>Close</button>
              <button className="btn-primary" onClick={() => handlePrint()}>Print</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <Receipt ref={printRef} submission={lastSubmission} pharmacy={lastPharmacy} receivedByName={profile?.full_name} />
      </div>
    </div>
  )
}
