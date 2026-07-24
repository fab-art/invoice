// Vercel Serverless Function
// POST /api/send-receipt-email
// Sends a receipt confirmation email to the pharmacy via SendGrid.
// Requires env vars: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL (verified sender), SENDGRID_FROM_NAME (optional)

import sgMail from '@sendgrid/mail'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, pharmacyName, receiptNumber, voucherCount, receivedAt } = req.body || {}

  if (!to || !receiptNumber) {
    return res.status(400).json({ error: 'Missing required fields (to, receiptNumber).' })
  }

  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL
  const fromName = process.env.SENDGRID_FROM_NAME || 'RSSB Pharmacy Invoice Reception'

  if (!apiKey || !fromEmail) {
    console.error('SendGrid is not configured (missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL).')
    return res.status(500).json({ error: 'Email service not configured.' })
  }

  sgMail.setApiKey(apiKey)

  const receivedDate = receivedAt ? new Date(receivedAt) : new Date()
  const formattedDate = receivedDate.toLocaleString('en-GB', { timeZone: 'Africa/Kigali' })

  const msg = {
    to,
    from: { email: fromEmail, name: fromName },
    subject: `RSSB Reception Confirmation — Receipt ${receiptNumber}`,
    text:
      `Dear ${pharmacyName || 'Partner Pharmacy'},\n\n` +
      `This confirms RSSB received ${voucherCount ?? '—'} voucher(s) from you on ${formattedDate}.\n` +
      `Receipt Number: ${receiptNumber}\n\n` +
      `This is an automated confirmation and does not represent verification or payment approval.\n\n` +
      `RSSB Pharmacy Invoice Reception`,
    html:
      `<p>Dear ${pharmacyName || 'Partner Pharmacy'},</p>` +
      `<p>This confirms RSSB received <strong>${voucherCount ?? '—'}</strong> voucher(s) from you on <strong>${formattedDate}</strong>.</p>` +
      `<p><strong>Receipt Number:</strong> ${receiptNumber}</p>` +
      `<p style="color:#666;font-size:13px;">This is an automated confirmation and does not represent verification or payment approval.</p>` +
      `<p>RSSB Pharmacy Invoice Reception</p>`,
  }

  try {
    await sgMail.send(msg)
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('SendGrid error:', err?.response?.body || err.message)
    return res.status(502).json({ error: 'Failed to send email.' })
  }
}
