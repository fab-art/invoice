import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../lib/supabaseClient'

const STATUS_FILTERS = ['all', 'submitted', 'under_review', 'verified', 'rejected', 'paid']

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [summary, setSummary] = useState({ total: 0, submitted: 0, verified: 0, paid: 0, pharmaciesRemaining: 0 })
  const [payModal, setPayModal] = useState(null)
  const [paymentId, setPaymentId] = useState('')
  const [paidAmount, setPaidAmount] = useState('')

  useEffect(() => { load() }, [statusFilter])

  async function load() {
    let query = supabase
      .from('submissions')
      .select('*, pharmacies(pharmacy_name, pharmacy_code, district)')
      .order('received_at', { ascending: false })
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data } = await query
    setSubmissions(data || [])
    loadSummary()
  }

  async function loadSummary() {
    const { count: total } = await supabase.from('submissions').select('*', { count: 'exact', head: true })
    const { count: submitted } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'submitted')
    const { count: verified } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'verified')
    const { count: paid } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'paid')

    const { data: period } = await supabase.from('submission_periods').select('id').eq('is_active', true).limit(1).single()
    let pharmaciesRemaining = 0
    if (period) {
      const { count: totalPharm } = await supabase.from('pharmacies').select('*', { count: 'exact', head: true }).eq('active', true)
      const { data: subs } = await supabase.from('submissions').select('pharmacy_id').eq('period_id', period.id)
      const uniqueSubmitted = new Set((subs || []).map(s => s.pharmacy_id)).size
      pharmaciesRemaining = (totalPharm || 0) - uniqueSubmitted
    }
    setSummary({ total: total || 0, submitted: submitted || 0, verified: verified || 0, paid: paid || 0, pharmaciesRemaining })
  }

  async function updateStatus(id, status) {
    const { data: { user } } = await supabase.auth.getUser()
    const updates = { status }
    if (status === 'verified') { updates.verified_at = new Date().toISOString(); updates.verified_by = user?.id }
    await supabase.from('submissions').update(updates).eq('id', id)
    load()
  }

  function openPayModal(sub) {
    setPayModal(sub)
    setPaymentId(sub.payment_id || '')
    setPaidAmount(sub.paid_amount || sub.invoice_total_amount || '')
  }

  async function confirmPayment() {
    if (!paymentId.trim()) return
    await supabase.from('submissions').update({
      status: 'paid',
      payment_id: paymentId.trim(),
      paid_amount: paidAmount ? Number(paidAmount) : null,
      paid_at: new Date().toISOString(),
    }).eq('id', payModal.id)
    setPayModal(null)
    load()
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

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

      <table className="data-table">
        <thead>
          <tr>
            <th>Receipt No.</th><th>Pharmacy</th><th>Vouchers</th><th>Amount</th>
            <th>Received</th><th>Status</th><th>Payment ID</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(s => (
            <tr key={s.id}>
              <td>{s.receipt_number}</td>
              <td>{s.pharmacies?.pharmacy_name} ({s.pharmacies?.pharmacy_code})</td>
              <td>{s.voucher_count}</td>
              <td>{s.invoice_total_amount ? Number(s.invoice_total_amount).toLocaleString() : '—'}</td>
              <td>{dayjs(s.received_at).format('DD/MM/YY HH:mm')}</td>
              <td><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
              <td>{s.payment_id || '—'}</td>
              <td className="actions-cell">
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
          ))}
          {submissions.length === 0 && <tr><td colSpan={8}>No submissions match this filter.</td></tr>}
        </tbody>
      </table>

      {payModal && (
        <div className="modal-backdrop" onClick={() => setPayModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Mark as Paid</h3>
            <p>{payModal.pharmacies?.pharmacy_name} — {payModal.receipt_number}</p>
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
