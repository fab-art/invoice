import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { listSubmissionsBetween, listPharmacies, updateSubmission } from '../lib/localDb'
import { openMailDraft, buildSupervisorReportEmail } from '../lib/email'

const NAVY = [27, 42, 107]
const GOLD = [245, 166, 35]

async function loadLogoDataUrl() {
  try {
    const res = await fetch('/rssb-logo.png')
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export default function DailyReport() {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [rows, setRows] = useState([])
  const [pharmacyMap, setPharmacyMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [emailNotice, setEmailNotice] = useState('')
  const [editRow, setEditRow] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

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
        'Submitted by': r.submitted_by_name || '',
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
      { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'RECEPTION REPORT')
    XLSX.writeFile(wb, `RSSB_Reception_Report_${date}.xlsx`)
  }

  async function exportPdf() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const logo = await loadLogoDataUrl()

    // Header band
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, pageWidth, 70, 'F')
    doc.setFillColor(...GOLD)
    doc.rect(0, 70, pageWidth, 4, 'F')

    if (logo) {
      try { doc.addImage(logo, 'PNG', 30, 12, 92, 46) } catch { /* ignore bad image */ }
    }

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('RWANDA SOCIAL SECURITY BOARD', pageWidth - 30, 28, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Pharmaceutical Invoices Verification Unit', pageWidth - 30, 44, { align: 'right' })

    doc.setTextColor(20, 26, 51)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(reportTitle, pageWidth / 2, 95, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(217, 140, 15)
    doc.text('1. ACHIEVEMENTS', 30, 118)

    const head = [[
      'No', 'Code', 'Health Facility', 'District', 'Date of Reception',
      'Vouchers', 'Amount Billed (RWF)', 'Submitted By', 'Status',
    ]]
    const body = rows.map((r, i) => {
      const p = pharmacyMap[r.pharmacy_id] || {}
      return [
        i + 1,
        p.pharmacy_code || '',
        p.pharmacy_name || '',
        (p.district || '').toUpperCase(),
        dayjs(r.received_at).format('DD/MM/YYYY'),
        r.voucher_count,
        r.invoice_total_amount ? Number(r.invoice_total_amount).toLocaleString() : '—',
        r.submitted_by_name || '—',
        r.status,
      ]
    })

    autoTable(doc, {
      head,
      body,
      startY: 130,
      margin: { left: 30, right: 30 },
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 5, textColor: [28, 35, 51] },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold', halign: 'left' },
      alternateRowStyles: { fillColor: [244, 246, 251] },
      foot: [[
        '', '', '', '', 'Total', totals.vouchers, totals.amount.toLocaleString(), '', `${rows.length} submissions`,
      ]],
      footStyles: { fillColor: [232, 235, 247], textColor: NAVY, fontStyle: 'bold' },
      didDrawPage(data) {
        const pageCount = doc.internal.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(120, 120, 120)
        doc.text(
          `Generated ${dayjs().format('DD/MM/YYYY HH:mm')} · Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.getHeight() - 18
        )
      },
    })

    doc.save(`RSSB_Reception_Report_${date}.pdf`)
  }

  async function handleEmailSupervisor() {
    await exportPdf()
    const draft = buildSupervisorReportEmail({ date: dayjs(date).format('DD/MM/YYYY'), rows, totals })
    setEmailNotice('The PDF report has just downloaded, and an Outlook draft is opening for your supervisor. Attach the downloaded PDF to the draft before sending.')
    openMailDraft(draft)
  }

  function openEdit(row) {
    setEditRow(row)
    setEditForm({
      voucher_count: row.voucher_count ?? '',
      invoice_total_amount: row.invoice_total_amount ?? '',
      submitted_by_name: row.submitted_by_name || '',
      submitted_by_position: row.submitted_by_position || '',
      submitted_by_contact: row.submitted_by_contact || '',
      requirements_notes: row.requirements_notes || '',
      status: row.status,
    })
  }

  async function saveEdit() {
    if (!editRow) return
    setSaving(true)
    try {
      await updateSubmission(editRow.id, {
        voucher_count: editForm.voucher_count ? Number(editForm.voucher_count) : 0,
        invoice_total_amount: editForm.invoice_total_amount ? Number(editForm.invoice_total_amount) : null,
        submitted_by_name: editForm.submitted_by_name || null,
        submitted_by_position: editForm.submitted_by_position || null,
        submitted_by_contact: editForm.submitted_by_contact || null,
        requirements_notes: editForm.requirements_notes || null,
        status: editForm.status,
      })
      setEditRow(null)
      setEditForm(null)
      loadReport()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <h2>Daily Report</h2>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn-secondary" onClick={exportExcel} disabled={rows.length === 0}>Export Excel</button>
        <button className="btn-primary" onClick={exportPdf} disabled={rows.length === 0}>Download PDF Report</button>
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
                <th>Date of Reception</th><th>Vouchers</th><th>Amount Billed</th>
                <th>Submitted By</th><th>Status</th><th>Actions</th>
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
                    <td>{r.submitted_by_name || '—'}</td>
                    <td><span className={`status-badge status-${r.status}`}>{r.status}</span></td>
                    <td className="actions-cell">
                      <button className="btn-link" onClick={() => openEdit(r)}>Edit</button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && <tr><td colSpan={10}>No submissions for this date.</td></tr>}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={5}>Total</td>
                  <td>{totals.vouchers}</td>
                  <td>{totals.amount.toLocaleString()}</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {editRow && editForm && (
        <div className="modal-backdrop" onClick={() => setEditRow(null)}>
          <div className="modal-card modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>Edit Submission — {editRow.receipt_number}</h3>
              <button className="modal-close" onClick={() => setEditRow(null)}>✕</button>
            </div>
            <p className="pharmacy-summary" style={{ margin: '-0.5rem 0 1rem' }}>
              {(pharmacyMap[editRow.pharmacy_id] || {}).pharmacy_name}
            </p>

            <div className="form-row">
              <div>
                <label>Vouchers submitted</label>
                <input type="number" min="0" value={editForm.voucher_count}
                  onChange={e => setEditForm(f => ({ ...f, voucher_count: e.target.value }))} />
              </div>
              <div>
                <label>Invoice total (RWF)</label>
                <input type="number" min="0" value={editForm.invoice_total_amount}
                  onChange={e => setEditForm(f => ({ ...f, invoice_total_amount: e.target.value }))} />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>Submitted by — name</label>
                <input value={editForm.submitted_by_name}
                  onChange={e => setEditForm(f => ({ ...f, submitted_by_name: e.target.value }))} />
              </div>
              <div>
                <label>Position</label>
                <input value={editForm.submitted_by_position}
                  onChange={e => setEditForm(f => ({ ...f, submitted_by_position: e.target.value }))} />
              </div>
              <div>
                <label>Contact number</label>
                <input value={editForm.submitted_by_contact}
                  onChange={e => setEditForm(f => ({ ...f, submitted_by_contact: e.target.value }))} />
              </div>
            </div>

            <label>Status</label>
            <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>

            <label>Notes</label>
            <textarea rows={2} value={editForm.requirements_notes}
              onChange={e => setEditForm(f => ({ ...f, requirements_notes: e.target.value }))} />

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setEditRow(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
