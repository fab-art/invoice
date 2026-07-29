import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { listSubmissionsBetween, listPharmacies } from '../lib/localDb'
import { openMailDraft, buildSupervisorReportEmail } from '../lib/email'

export default function DailyReport() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [rows, setRows] = useState([])
  const [pharmacyMap, setPharmacyMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [emailNotice, setEmailNotice] = useState('')

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

  const reportTitle = `PHARMACEUTICAL INVOICES VERIFICATION UNIT: RECEPTION REPORT FROM ${dayjs(date).format('DD/MM/YYYY')}`

  function buildSheetRows() {
    return rows.map((r, i) => {
      const p = pharmacyMap[r.pharmacy_id] || {}
      const received = dayjs(r.received_at)
      return {
        'No': i + 1,
        'Code Health Facility': p.pharmacy_code || '',
        'Health Facility': p.pharmacy_name || '',
        'Health Facility Category': 'PHARM',
        'DISTRICT': (p.district || '').toUpperCase(),
        'PERIOD': dayjs(date).format('MMMM/YY').toLowerCase(),
        'Date': received.date(),
        'Month': received.month() + 1,
        'Year': received.year(),
        'Date of reception': received.format('YYYY-MM-DD'),
        'Vouchers': r.voucher_count,
        'Amount billed': r.invoice_total_amount || '',
        'Status': r.status,
        'Payment ID': r.payment_id || '',
      }
    })
  }

  function exportExcel() {
    const sheetData = buildSheetRows()
    const ws = XLSX.utils.aoa_to_sheet([
      [reportTitle],
      [],
      ['1. ACHIEVEMENTS'],
    ])
    XLSX.utils.sheet_add_json(ws, sheetData, { origin: 'A4', skipHeader: false })
    ws['!cols'] = [
      { wch: 6 }, { wch: 22 }, { wch: 30 }, { wch: 12 }, { wch: 16 },
      { wch: 12 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 16 },
      { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'RECEPTION REPORT')
    XLSX.writeFile(wb, `RSSB_Reception_Report_${date}.xlsx`)
  }

  function handleEmailSupervisor() {
    exportExcel()
    const draft = buildSupervisorReportEmail({ date: dayjs(date).format('DD/MM/YYYY'), rows, totals })
    setEmailNotice('The Excel report has just downloaded, and an Outlook draft is opening for your supervisor. Attach the downloaded file to the draft before sending.')
    openMailDraft(draft)
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <h2>Daily Report</h2>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn-secondary" onClick={exportExcel} disabled={rows.length === 0}>Export Excel</button>
        <button className="btn-gold" onClick={handleEmailSupervisor} disabled={rows.length === 0}>Email Report to Supervisor</button>
      </div>

      {emailNotice && <div className="alert-info">{emailNotice}</div>}

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

      <div className="report-doc">
        <div className="report-doc-title">{reportTitle}</div>
        <div className="report-doc-subtitle">1. Achievements</div>

        {loading ? <p>Loading...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th><th>Code</th><th>Health Facility</th><th>District</th>
                <th>Date of Reception</th><th>Vouchers</th><th>Amount Billed</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const p = pharmacyMap[r.pharmacy_id] || {}
                return (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{p.pharmacy_code}</td>
                    <td>{p.pharmacy_name}</td>
                    <td>{(p.district || '').toUpperCase()}</td>
                    <td>{dayjs(r.received_at).format('DD/MM/YYYY')}</td>
                    <td>{r.voucher_count}</td>
                    <td>{r.invoice_total_amount ? Number(r.invoice_total_amount).toLocaleString() : '—'}</td>
                    <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                  </tr>
                )
              })}
              {rows.length === 0 && <tr><td colSpan={8}>No submissions for this date.</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={5}>Total</td>
                  <td>{totals.vouchers}</td>
                  <td>{totals.amount.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  )
}
