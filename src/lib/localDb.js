// Local-first data layer using IndexedDB (via the `idb` helper library).
// This replaces Supabase for now — same shape of data, so swapping back to
// a real backend later just means rewriting this file's functions.

import { openDB } from 'idb'

const DB_NAME = 'rssb-reception-db'
const DB_VERSION = 1

let dbPromise = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('users')) {
          const store = db.createObjectStore('users', { keyPath: 'id' })
          store.createIndex('by_email', 'email', { unique: true })
        }
        if (!db.objectStoreNames.contains('pharmacies')) {
          const store = db.createObjectStore('pharmacies', { keyPath: 'id' })
          store.createIndex('by_code', 'pharmacy_code', { unique: true })
        }
        if (!db.objectStoreNames.contains('periods')) {
          db.createObjectStore('periods', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('submissions')) {
          const store = db.createObjectStore('submissions', { keyPath: 'id' })
          store.createIndex('by_pharmacy', 'pharmacy_id')
          store.createIndex('by_period', 'period_id')
          store.createIndex('by_status', 'status')
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

function uuid() {
  return crypto.randomUUID()
}

// ---------------------------------------------------------------
// Seed data on first run: a default admin user + an active period
// ---------------------------------------------------------------
export async function ensureSeeded() {
  const db = await getDb()
  const userCount = await db.count('users')
  if (userCount === 0) {
    await db.put('users', {
      id: uuid(),
      email: 'admin@rssb.local',
      password: 'admin123', // local-only demo auth — replace with real auth later
      full_name: 'Default Admin',
      role: 'admin',
    })
    await db.put('users', {
      id: uuid(),
      email: 'reception@rssb.local',
      password: 'reception123',
      full_name: 'Front Desk',
      role: 'receptionist',
    })
  }
  const periodCount = await db.count('periods')
  if (periodCount === 0) {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    await db.put('periods', {
      id: uuid(),
      label: now.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      is_active: true,
    })
  }
  const receiptSeq = await db.get('meta', 'receipt_seq')
  if (!receiptSeq) await db.put('meta', { key: 'receipt_seq', value: 0 })
}

// ---------------------------------------------------------------
// Auth (local-only demo — email/password checked against IndexedDB)
// ---------------------------------------------------------------
export async function login(email, password) {
  const db = await getDb()
  const user = await db.getFromIndex('users', 'by_email', email)
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password.')
  }
  const session = { id: user.id, email: user.email, full_name: user.full_name, role: user.role }
  localStorage.setItem('rssb_session', JSON.stringify(session))
  return session
}

export function logout() {
  localStorage.removeItem('rssb_session')
}

export function getSession() {
  const raw = localStorage.getItem('rssb_session')
  return raw ? JSON.parse(raw) : null
}

// ---------------------------------------------------------------
// Pharmacies
// ---------------------------------------------------------------
export async function listPharmacies({ activeOnly = false } = {}) {
  const db = await getDb()
  let all = await db.getAll('pharmacies')
  if (activeOnly) all = all.filter(p => p.active)
  return all.sort((a, b) => a.pharmacy_name.localeCompare(b.pharmacy_name))
}

export async function upsertPharmacy(pharmacy) {
  const db = await getDb()
  if (pharmacy.id) {
    await db.put('pharmacies', pharmacy)
    return pharmacy
  }
  const existing = await db.getFromIndex('pharmacies', 'by_code', pharmacy.pharmacy_code)
  const record = { ...existing, ...pharmacy, id: existing?.id || uuid(), active: pharmacy.active ?? true }
  await db.put('pharmacies', record)
  return record
}

export async function bulkUpsertPharmacies(rows) {
  const db = await getDb()
  const tx = db.transaction('pharmacies', 'readwrite')
  const index = tx.store.index('by_code')
  let count = 0
  for (const row of rows) {
    const existing = await index.get(row.pharmacy_code)
    const record = { ...existing, ...row, id: existing?.id || uuid(), active: true }
    await tx.store.put(record)
    count++
  }
  await tx.done
  return count
}

export async function togglePharmacyActive(pharmacy) {
  const db = await getDb()
  await db.put('pharmacies', { ...pharmacy, active: !pharmacy.active })
}

// ---------------------------------------------------------------
// Submission periods
// ---------------------------------------------------------------
export async function getActivePeriod() {
  const db = await getDb()
  const all = await db.getAll('periods')
  return all.find(p => p.is_active) || null
}

// ---------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------
async function nextReceiptNumber() {
  const db = await getDb()
  const tx = db.transaction('meta', 'readwrite')
  const current = (await tx.store.get('receipt_seq'))?.value || 0
  const next = current + 1
  await tx.store.put({ key: 'receipt_seq', value: next })
  await tx.done
  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  return `RSSB-${dateStr}-${String(next).padStart(5, '0')}`
}

export async function createSubmission(payload) {
  const db = await getDb()
  const receipt_number = await nextReceiptNumber()
  const record = {
    id: uuid(),
    receipt_number,
    received_at: new Date().toISOString(),
    status: 'submitted',
    ...payload,
  }
  await db.put('submissions', record)
  return record
}

export async function updateSubmission(id, updates) {
  const db = await getDb()
  const existing = await db.get('submissions', id)
  const updated = { ...existing, ...updates }
  await db.put('submissions', updated)
  return updated
}

export async function listSubmissions({ status } = {}) {
  const db = await getDb()
  let all = await db.getAll('submissions')
  if (status && status !== 'all') all = all.filter(s => s.status === status)
  return all.sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
}

export async function listSubmissionsBetween(startIso, endIso) {
  const db = await getDb()
  const all = await db.getAll('submissions')
  return all
    .filter(s => s.received_at >= startIso && s.received_at <= endIso)
    .sort((a, b) => new Date(a.received_at) - new Date(b.received_at))
}

export async function countSubmissionsSince(startIso) {
  const all = await listSubmissions()
  return all.filter(s => s.received_at >= startIso).length
}

export async function getRemainingPharmacyCount(periodId) {
  const db = await getDb()
  const pharmacies = await listPharmacies({ activeOnly: true })
  const submissions = periodId ? await db.getAllFromIndex('submissions', 'by_period', periodId) : []
  const submittedIds = new Set(submissions.map(s => s.pharmacy_id))
  return pharmacies.length - submittedIds.size
}

export async function getPharmacyById(id) {
  const db = await getDb()
  return db.get('pharmacies', id)
}
