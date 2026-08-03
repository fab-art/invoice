import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useSettings } from '../lib/SettingsContext.jsx'
import {
  listSubmissions, updateSubmission, listPharmacies, getActivePeriod, getRemainingPharmacyCount,
  listPeriods, setActivePeriod,
} from '../lib/localDb'

const STATUS_FILTERS = ['all', 'submitted', 'under_review', 'verified', 'rejected', 'paid']

export default function Verification() {
  const { operatorName } = useSettings()
  const [submissions, setSubmissions] = useState([])
  const [pharmacyMap, setPharmacyMap] = useState({})
  const [statusFilter, setStatusFilter] = useState('all')
  const [summary, setSummary] = useState({ total: 0, submitted: 0, verified: 0, paid: 0, pharmaciesRemaining: 0 })
  const [periods, setPeriods] = useState([])
  const [activePeriod, setActivePeriodState] = useState(null)
  const [payModal, setPayModal] = useState(null)
  const [paymentId, setPaymentId] = useState('')
  const [paidAmount, setPaidAmount] = useState('')

  useEffect(() => { load() }, [statusFilter])

  async function load() {
    const [subs, pharmacies, allSubs, period, allPeriods] = await Promise.all([
      listSubmissions({ status: statusFilter }),
      listPharmacies(),
      listSubmissions(),
      getActivePeriod(),
      listPeriods(),
    ])
    const map = {}
    pharmacies.forEach(p => { map[p.id] = p })
    setPharmacyMap(map)
    setSubmissions(subs)
    setPeriods(allPeriods)
    setActivePeriodState(period)

    const remaining = await getRemainingPharmacyCount(period?.id)
    setSummary({
      total: allSubs.length,
      submitted: allSubs.filter(s => s.status === 'submitted').length,
      verified: allSubs.filter(s => s.status === 'verified').length,
      paid: allSubs.filter(s => s.status === 'paid').length,
      pharmaciesRemaining: remaining,
    })
  }

  async function updateStatus(id, status) {
    const updates = { status }
    if (status === 'verified') { updates.verified_at = new Date().toISOString(); updates.verified_by = operatorName || null }
    await updateSubmission(id, updates)
    load()
  }

  async function handlePeriodChange(e) {
    await setActivePeriod(e.target.value)
    load()
  }

  function openPayModal(sub) {
    setPayModal(sub)
    setPaymentId(sub.payment_id || '')
    setPaidAmount(sub.paid_amount || sub.invoice_total_amount || '')
  }

  async function confirmPayment() {
    if (!paymentId.trim()) return
    await updateSubmission(payModal.id, {
      status: 'paid',
      payment_id: paymentId.trim(),
      paid_amount: paidAmount ? Number(paidAmount) : null,
      paid_at: new Date().toISOString(),
    })
    setPayModal(null)
    load()
  }

  return (
    <div className="admin-dashboard">
      <div className="page-header-row">
        <h2>Verification &amp; Payments</h2>
        <div className="period-switcher">
          <label htmlFor="period-select">Billing period</label>
          <select id="period-select" value={activePeriod?.id || ''} onChange={handlePeriodChange}>
            {periods.map(p => (
              <option key={p.id} value={p.id}>{p.label}{p.is_active ? ' (active)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="reception-stats">
        <div className="stat-card"><span className="stat-value">{summary.total}</span><span className="stat-label">Total submissions</span></div>
        <div className="stat-card"><span className="stat-value">{summary.submitted}</span><span className="stat-label">Awaiting review</span></div>
        <div className="stat-card"><span className="stat-value">{summary.verified}</span><span className="stat-label">Verified</span></div>
        <div className="stat-card"><span className="stat-value">{summary.paid}</span><span className="stat-label">Paid</span></div>
        <div className="stat-card"><span className="stat-value">{summary.pharmaciesRemaining}</span><span className="stat-label">Pharmacies remaining this period</span></div>
      </div>

      <div className="filter-row">
        {STATUS_FILTERS.map(s => (
          <button key={s} className={`chip ${statusFilter === s ? 'chip-active' : ''}`} onClick={() => setStatusFilter(s)}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <table className="data-table stack-on-mobile">
        <thead>
          <tr>
            <th>Receipt No.</th><th>Pharmacy</th><th>Vouchers</th><th>Amount</th>
            <th>Received</th><th>Status</th><th>Payment ID</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(s => {
            const p = pharmacyMap[s.pharmacy_id] || {}
            return (
              <tr key={s.id}>
                <td data-label="Receipt No.">{s.receipt_number}</td>
                <td data-label="Pharmacy">{p.pharmacy_name} ({p.pharmacy_code})</td>
                <td data-label="Vouchers">{s.voucher_count}</td>
                <td data-label="Amount">{s.invoice_total_amount ? Number(s.invoice_total_amount).toLocaleString() : '—'}</td>
                <td data-label="Received">{dayjs(s.received_at).format('DD/MM/YY HH:mm')}</td>
                <td data-label="Status"><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
                <td data-label="Payment ID">{s.payment_id || '—'}</td>
                <td data-label="Actions" className="actions-cell">
                  {s.status === 'submitted' && <button className="btn-link" onClick={() => updateStatus(s.id, 'under_review')}>Start review</button>}
                  {(s.status === 'submitted' || s.status === 'under_review') && (
                    <>
                      <button className="btn-link" onClick={() => updateStatus(s.id, 'verified')}>Verify</button>
                      <button className="btn-link" onClick={() => updateStatus(s.id, 'rejected')}>Reject</button>
                    </>
                  )}
                  {s.status === 'verified' && <button className="btn-link" onClick={() => openPayModal(s)}>Mark paid</button>}
                </td>
              </tr>
            )
          })}
          {submissions.length === 0 && <tr><td colSpan={8}>No submissions match this filter.</td></tr>}
        </tbody>
      </table>

      {payModal && (
        <div className="modal-backdrop" onClick={() => setPayModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Mark as Paid</h3>
            <p>{pharmacyMap[payModal.pharmacy_id]?.pharmacy_name} — {payModal.receipt_number}</p>
            <label>Payment ID</label>
            <input value={paymentId} onChange={e => setPaymentId(e.target.value)} required />
            <label>Paid Amount (RWF)</label>
            <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={confirmPayment}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
