import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { listSubmissionsBetween, listPharmacies } from '../lib/localDb'

export default function DailyReport() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [rows, setRows] = useState([])
  const [pharmacyMap, setPharmacyMap] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadReport() }, [date])

  async function loadReport() {
    setLoading(true)
    const start = dayjs(date).startOf('day').toISOString()
    const end = dayjs(date).endOf('day').toISOString()
    const [submissions, pharmacies] = await Promise.all([
      listSubmissionsBetween(start, end),
      listPharmacies(),
    ])
    const map = {}
    pharmacies.forEach(p => { map[p.id] = p })
    setPharmacyMap(map)
    setRows(submissions)
    setLoading(false)
  }

  const totals = rows.reduce((acc, r) => {
    acc.vouchers += r.voucher_count || 0
    acc.amount += Number(r.invoice_total_amount || 0)
    return acc
  }, { vouchers: 0, amount: 0 })

  function exportExcel() {
    const sheetData = rows.map(r => {
      const p = pharmacyMap[r.pharmacy_id] || {}
      return {
        'Receipt No.': r.receipt_number,
        'Time': dayjs(r.received_at).format('HH:mm'),
        'Pharmacy': p.pharmacy_name,
        'Code': p.pharmacy_code,
        'District': p.district,
        'Vouchers': r.voucher_count,
        'Invoice Total (RWF)': r.invoice_total_amount || '',
        'Status': r.status,
        'Payment ID': r.payment_id || '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `RSSB_Reception_Report_${date}.xlsx`)
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <h2>Daily Report</h2>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn-secondary" onClick={exportExcel} disabled={rows.length === 0}>Export Excel</button>
      </div>

      <div className="reception-stats">
        <div className="stat-card">
          <span className="stat-value">{rows.length}</span>
          <span className="stat-label">Submissions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.vouchers}</span>
          <span className="stat-label">Total vouchers</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totals.amount.toLocaleString()}</span>
          <span className="stat-label">Total invoice amount (RWF)</span>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt No.</th><th>Time</th><th>Pharmacy</th><th>District</th>
              <th>Vouchers</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const p = pharmacyMap[r.pharmacy_id] || {}
              return (
                <tr key={r.id}>
                  <td>{r.receipt_number}</td>
                  <td>{dayjs(r.received_at).format('HH:mm')}</td>
                  <td>{p.pharmacy_name} ({p.pharmacy_code})</td>
                  <td>{p.district}</td>
                  <td>{r.voucher_count}</td>
                  <td>{r.invoice_total_amount ? Number(r.invoice_total_amount).toLocaleString() : '—'}</td>
                  <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                </tr>
              )
            })}
            {rows.length === 0 && <tr><td colSpan={7}>No submissions for this date.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  )
}
