import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useAuth } from '../lib/AuthContext.jsx'
import PharmacySearch from '../components/PharmacySearch.jsx'
import Receipt from '../components/Receipt.jsx'
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
  const [todayCount, setTodayCount] = useState(0)
  const [remainingCount, setRemainingCount] = useState(null)
  const [error, setError] = useState('')
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
      refreshCounts(period)
      setTimeout(() => handlePrint(), 200)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSaving(false)
    }
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
          {REQUIREMENTS.map(r => (
            <label key={r.key} className="checklist-item">
              <input
                type="checkbox"
                checked={!!checks[r.key]}
                onChange={e => setChecks(c => ({ ...c, [r.key]: e.target.checked }))}
              />
              {r.label}
            </label>
          ))}
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
          <p>Receipt <strong>{lastSubmission.receipt_number}</strong> generated.</p>
          <button className="btn-link" onClick={() => handlePrint()}>Print again</button>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <Receipt ref={printRef} submission={lastSubmission} pharmacy={selected} receivedByName={profile?.full_name} />
      </div>
    </div>
  )
}
