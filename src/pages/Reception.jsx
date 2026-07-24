import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext.jsx'
import PharmacySearch from '../components/PharmacySearch.jsx'
import Receipt from '../components/Receipt.jsx'

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

  useEffect(() => {
    loadPharmacies()
    loadActivePeriod()
    loadTodayCount()
  }, [])

  async function loadPharmacies() {
    const { data } = await supabase.from('pharmacies').select('*').eq('active', true).order('pharmacy_name')
    setPharmacies(data || [])
  }

  async function loadActivePeriod() {
    const { data } = await supabase.from('submission_periods').select('*').eq('is_active', true).limit(1).single()
    setPeriod(data || null)
    if (data) loadRemaining(data.id)
  }

  async function loadRemaining(periodId) {
    const { count: totalPharm } = await supabase.from('pharmacies').select('*', { count: 'exact', head: true }).eq('active', true)
    const { data: submitted } = await supabase.from('submissions').select('pharmacy_id').eq('period_id', periodId)
    const uniqueSubmitted = new Set((submitted || []).map(s => s.pharmacy_id)).size
    setRemainingCount((totalPharm || 0) - uniqueSubmitted)
  }

  async function loadTodayCount() {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .gte('received_at', startOfDay.toISOString())
    setTodayCount(count || 0)
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
      const { data: receiptData, error: rpcError } = await supabase.rpc('generate_receipt_number')
      if (rpcError) throw rpcError

      const payload = {
        receipt_number: receiptData,
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
        status: 'submitted',
      }

      const { data, error: insertError } = await supabase.from('submissions').insert(payload).select().single()
      if (insertError) throw insertError

      setLastSubmission(data)
      setTodayCount(c => c + 1)
      if (period) loadRemaining(period.id)

      // Fire-and-forget email notification via serverless function (SendGrid)
      if (selected.email) {
        fetch('/api/send-receipt-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selected.email,
            pharmacyName: selected.pharmacy_name,
            receiptNumber: data.receipt_number,
            voucherCount: data.voucher_count,
            receivedAt: data.received_at,
          }),
        }).catch(() => {})
      }

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
