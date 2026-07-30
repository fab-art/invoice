import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const SEED_PHARMACIES = [
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
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const receptionPassword = await bcrypt.hash('reception123', 10);

  await db.user.upsert({
    where: { email: 'admin@rssb.local' },
    update: {},
    create: {
      email: 'admin@rssb.local',
      password: adminPassword,
      fullName: 'RSSB Administrator',
      role: 'ADMIN',
    },
  });

  await db.user.upsert({
    where: { email: 'reception@rssb.local' },
    update: {},
    create: {
      email: 'reception@rssb.local',
      password: receptionPassword,
      fullName: 'Marie Receptionist',
      role: 'RECEPTIONIST',
    },
  });

  console.log('✅ Users seeded');

  // Seed Pharmacies
  for (const p of SEED_PHARMACIES) {
    await db.pharmacy.upsert({
      where: { pharmacyCode: p.pharmacy_code },
      update: {},
      create: {
        pharmacyCode: p.pharmacy_code,
        pharmacyName: p.pharmacy_name,
        district: p.district,
      },
    });
  }

  console.log(`✅ ${SEED_PHARMACIES.length} pharmacies seeded`);

  // Seed SubmissionPeriods
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  for (let month = 0; month < 12; month++) {
    const startDate = new Date(currentYear, month, 1);
    const endDate = new Date(currentYear, month + 1, 0); // Last day of month
    const label = `${startDate.toLocaleDateString('en-US', { month: 'long' })} ${currentYear}`;

    await db.submissionPeriod.upsert({
      where: { id: `period-${currentYear}-${month}` },
      update: {},
      create: {
        id: `period-${currentYear}-${month}`,
        label,
        startDate,
        endDate,
        isActive: month === currentMonth,
      },
    });
  }

  console.log('✅ Submission periods seeded');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
