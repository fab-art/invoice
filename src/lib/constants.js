// Shared reference data for the reception system.

export const RWANDA_DISTRICTS = [
  // Kigali City
  'Nyarugenge', 'Gasabo', 'Kicukiro',
  // Southern Province
  'Nyanza', 'Gisagara', 'Nyaruguru', 'Huye', 'Nyamagabe', 'Ruhango', 'Muhanga', 'Kamonyi',
  // Western Province
  'Karongi', 'Rutsiro', 'Rubavu', 'Nyabihu', 'Ngororero', 'Rusizi', 'Nyamasheke',
  // Northern Province
  'Rulindo', 'Gakenke', 'Musanze', 'Burera', 'Gicumbi',
  // Eastern Province
  'Rwamagana', 'Nyagatare', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Bugesera',
]

// Seed pharmacies drawn from the real served-provider list, so the demo
// reflects actual reception volume instead of placeholder rows.
export const SEED_PHARMACIES = [
  { pharmacy_code: '201331049', pharmacy_name: 'MEDPLUS PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '202331076', pharmacy_name: 'EAGLE PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '201331113', pharmacy_name: 'DYNAMIC PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '202331053', pharmacy_name: 'DU PHARE PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '202331064', pharmacy_name: 'SALAMA POINT PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '202331051', pharmacy_name: 'GOODLIFE SILVERBACK PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '201331073', pharmacy_name: 'VISTA ZINDIRO PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '505331015', pharmacy_name: 'RAFI PHARMACY', district: 'Rubavu' },
  { pharmacy_code: '201331037', pharmacy_name: 'UNIQUE PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '202331020', pharmacy_name: 'GALEAD PHARMACY', district: 'Kicukiro' },
].map(p => ({ ...p, sector: null, contact_person: null, phone: null, email: null }))

// 12 monthly billing periods for the year, used to seed the periods store.
export function buildYearPeriods(year) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const now = new Date()
  return months.map((m, i) => {
    const start = new Date(year, i, 1)
    const end = new Date(year, i + 1, 0)
    return {
      label: `${m} ${year}`,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      is_active: year === now.getFullYear() && i === now.getMonth(),
    }
  })
}
