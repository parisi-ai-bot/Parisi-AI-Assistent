const nodemailer = require("nodemailer");

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP env vars. Need SMTP_HOST, SMTP_USER, SMTP_PASS (+ SMTP_PORT)");
  }

  // STARTTLS on 587; on 465 use secure:true
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendCustomerEmail(to, subject, html, text) {
  const from = process.env.FROM_MAIL;
  if (!from) throw new Error("Missing FROM_MAIL env var");

  const transporter = getTransport();

  const mail = {
    from,
    to,
    subject,
    html: html || undefined,
    text: text || undefined,
    replyTo: process.env.REPLY_TO || undefined,
  };

  return transporter.sendMail(mail);
}

module.exports = { sendCustomerEmail };
