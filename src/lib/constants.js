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
// Seed pharmacies drawn from the RSSB Pharmaceutical Invoices Verification
// Unit reception report, so the demo reflects real served-provider volume.
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
  { pharmacy_code: '107331004', pharmacy_name: 'ADONAI PHARMACY', district: 'Rwamagana' },
  { pharmacy_code: '201331117', pharmacy_name: 'JUSTPHARMA PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '303331006', pharmacy_name: 'SAINT THERESE PHARMACY', district: 'Gicumbi' },
  { pharmacy_code: '104331003', pharmacy_name: 'TRUSTED PHARMACY', district: 'Kirehe' },
  { pharmacy_code: '203331063', pharmacy_name: 'ALVIN PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '304331018', pharmacy_name: 'THESO PHARMACY', district: 'Musanze' },
  { pharmacy_code: '202331073', pharmacy_name: 'FAITH PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '107331001', pharmacy_name: 'INITIATIVE PHARMACY', district: 'Rwamagana' },
  { pharmacy_code: '402331004', pharmacy_name: 'VIVA PHARMACY', district: 'Huye' },
  { pharmacy_code: '202331080', pharmacy_name: 'CONCORDE PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '203331014', pharmacy_name: 'MUHIRE PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '202331050', pharmacy_name: 'ELITE PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '203331047', pharmacy_name: 'SANOPHAR PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '202331061', pharmacy_name: 'ZIA PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '404331032', pharmacy_name: 'PHARMAGY PHARMACY', district: 'Muhanga' },
  { pharmacy_code: '303331002', pharmacy_name: 'ACCESS PHARMACY', district: 'Gicumbi' },
  { pharmacy_code: '404331016', pharmacy_name: 'GOODCHOICE PHARMACY', district: 'Muhanga' },
  { pharmacy_code: '408331006', pharmacy_name: 'GERIC PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '501331001', pharmacy_name: 'KINDNESS PHARMACY', district: 'Karongi' },
  { pharmacy_code: '103331008', pharmacy_name: 'TRINIVIVE PHARMACY', district: 'Kayonza' },
  { pharmacy_code: '202331078', pharmacy_name: 'ZIP PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '202331014', pharmacy_name: 'SEMU PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '2023310144', pharmacy_name: 'SEMU BRANCH PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '201331071', pharmacy_name: 'IGIHOZO PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '203331037', pharmacy_name: 'NEZA PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '201331107', pharmacy_name: 'IRIS JABANA PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '408331007', pharmacy_name: 'IWAWE PHARMACY', district: 'Ruhango' },
  { pharmacy_code: '201331034', pharmacy_name: 'GOODLIFE PHARMACEUTICALS PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '202331042', pharmacy_name: 'DEPHAR PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '203331098', pharmacy_name: 'GOODLIFE TOWN BRANCH PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '201331052', pharmacy_name: 'AMAYA PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '201331065', pharmacy_name: 'KARIS PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '201331009', pharmacy_name: 'LA CROIX DU SUD PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '107331011', pharmacy_name: 'ESPOIR PHARMACY', district: 'Rwamagana' },
  { pharmacy_code: '201331053', pharmacy_name: 'PHARMABEST PHARMACY', district: 'Huye' },
  { pharmacy_code: '404331018', pharmacy_name: 'J&M PHARMACY', district: 'Muhanga' },
  { pharmacy_code: '402331022', pharmacy_name: 'de BUTARE PHARMACY', district: 'Huye' },
  { pharmacy_code: '505331020', pharmacy_name: 'WESTERN PHARMACY', district: 'Rubavu' },
  { pharmacy_code: '203331091', pharmacy_name: 'JOSH PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '201331072', pharmacy_name: 'TERCERA PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '404331020', pharmacy_name: 'PILLAR PHARMACY', district: 'Muhanga' },
  { pharmacy_code: '201331110', pharmacy_name: 'MEDPLUS PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '202331035', pharmacy_name: 'VITA GRATIA PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '201331097', pharmacy_name: 'GOODLIFE GACURIRO PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '101331012', pharmacy_name: 'HEAL PHARMACY', district: 'Bugesera' },
  { pharmacy_code: '505331014', pharmacy_name: 'SINAPIS PHARMACY', district: 'Rubavu' },
  { pharmacy_code: '202331085', pharmacy_name: "L'EXPERIENCE PHARMACY", district: 'Kicukiro' },
  { pharmacy_code: '505331013', pharmacy_name: 'ANSWER PHARMACY', district: 'Rubavu' },
  { pharmacy_code: '201331035', pharmacy_name: 'INEPHAR PHARMACY', district: 'Gasabo' },
  { pharmacy_code: '404331030', pharmacy_name: 'KEMI PHARMACY', district: 'Muhanga' },
  { pharmacy_code: '408331003', pharmacy_name: 'GLORY PHARMACY', district: 'Ruhango' },
  { pharmacy_code: '202331068', pharmacy_name: 'GOLF PHARMACY', district: 'Kicukiro' },
  { pharmacy_code: '506331011', pharmacy_name: 'THE HUB PHARMACY', district: 'Rusizi' },
  { pharmacy_code: '504331003', pharmacy_name: 'TWITE KU BUZIMA PHARMACY', district: 'Nyamasheke' },
  { pharmacy_code: '402331021', pharmacy_name: 'WEMA PHARMACY', district: 'Huye' },
  { pharmacy_code: '203331059', pharmacy_name: 'NIMA PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '203331097', pharmacy_name: 'NGIRA PHARMACY', district: 'Nyarugenge' },
  { pharmacy_code: '201331116', pharmacy_name: 'KABARE PHARMACY', district: 'Gasabo' },
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
