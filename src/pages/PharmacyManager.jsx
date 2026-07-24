import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'

const emptyForm = { pharmacy_code: '', pharmacy_name: '', district: '', sector: '', contact_person: '', phone: '', email: '' }

export default function PharmacyManager() {
  const [pharmacies, setPharmacies] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('pharmacies').select('*').order('pharmacy_name')
    setPharmacies(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    if (editingId) {
      const { error } = await supabase.from('pharmacies').update(form).eq('id', editingId)
      if (error) setMessage(error.message)
    } else {
      const { error } = await supabase.from('pharmacies').insert(form)
      if (error) setMessage(error.message)
    }
    setForm(emptyForm)
    setEditingId(null)
    load()
  }

  function editPharmacy(p) {
    setForm({ ...emptyForm, ...p })
    setEditingId(p.id)
  }

  async function toggleActive(p) {
    await supabase.from('pharmacies').update({ active: !p.active }).eq('id', p.id)
    load()
  }

  async function handleBulkImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setMessage('Importing...')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(ws)

    const rows = json.map(row => ({
      pharmacy_code: String(row['pharmacy_code'] || row['Pharmacy Code'] || row['Code'] || '').trim(),
      pharmacy_name: String(row['pharmacy_name'] || row['Pharmacy Name'] || row['Name'] || '').trim(),
      district: String(row['district'] || row['District'] || '').trim(),
      sector: String(row['sector'] || row['Sector'] || '').trim() || null,
      contact_person: String(row['contact_person'] || row['Contact Person'] || '').trim() || null,
      phone: String(row['phone'] || row['Phone'] || '').trim() || null,
      email: String(row['email'] || row['Email'] || '').trim() || null,
    })).filter(r => r.pharmacy_code && r.pharmacy_name)

    if (rows.length === 0) { setMessage('No valid rows found in the file.'); return }

    const { error } = await supabase.from('pharmacies').upsert(rows, { onConflict: 'pharmacy_code' })
    setMessage(error ? error.message : `Imported ${rows.length} pharmacies.`)
    load()
    e.target.value = ''
  }

  const filtered = pharmacies.filter(p =>
    p.pharmacy_name.toLowerCase().includes(search.toLowerCase()) ||
    p.pharmacy_code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pharmacy-manager">
      <h2>Pharmacy Management</h2>
      {message && <div className="alert-info">{message}</div>}

      <div className="import-row">
        <label className="btn-secondary file-upload-btn">
          Bulk import from Excel
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkImport} hidden />
        </label>
        <span className="hint">Expected columns: pharmacy_code, pharmacy_name, district, sector, contact_person, phone, email</span>
      </div>

      <form className="pharmacy-form" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Edit Pharmacy' : 'Add New Pharmacy'}</h3>
        <div className="form-row">
          <div><label>Pharmacy Code</label><input value={form.pharmacy_code} onChange={e => setForm(f => ({ ...f, pharmacy_code: e.target.value }))} required /></div>
          <div><label>Pharmacy Name</label><input value={form.pharmacy_name} onChange={e => setForm(f => ({ ...f, pharmacy_name: e.target.value }))} required /></div>
        </div>
        <div className="form-row">
          <div><label>District</label><input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} required /></div>
          <div><label>Sector</label><input value={form.sector || ''} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
        </div>
        <div className="form-row">
          <div><label>Contact Person</label><input value={form.contact_person || ''} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} /></div>
          <div><label>Phone</label><input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        </div>
        <label>Email</label>
        <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <div className="form-actions">
          {editingId && <button type="button" className="btn-secondary" onClick={() => { setForm(emptyForm); setEditingId(null) }}>Cancel</button>}
          <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Add Pharmacy'}</button>
        </div>
      </form>

      <input className="table-search" placeholder="Search pharmacies..." value={search} onChange={e => setSearch(e.target.value)} />

      <table className="data-table">
        <thead><tr><th>Code</th><th>Name</th><th>District</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map(p => (
            <tr key={p.id}>
              <td>{p.pharmacy_code}</td>
              <td>{p.pharmacy_name}</td>
              <td>{p.district}</td>
              <td>{p.active ? 'Active' : 'Inactive'}</td>
              <td>
                <button className="btn-link" onClick={() => editPharmacy(p)}>Edit</button>
                <button className="btn-link" onClick={() => toggleActive(p)}>{p.active ? 'Deactivate' : 'Activate'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
