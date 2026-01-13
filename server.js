/**
 * parisi-ai-bot - minimal API server for lead + email notifications
 * Works on Railway or any Node host.
 *
 * Required ENV:
 *   NODE_ENV=production
 *   PORT= (Railway sets automatically)
 *   FROM_MAIL=kontakt@ai-agenturparisi.de   (or no-reply@..., see README)
 *   SMTP_HOST=live.smtp.mailtrap.io
 *   SMTP_PORT=587
 *   SMTP_USER=api
 *   SMTP_PASS=<MAILTRAP_SMTP_API_TOKEN>
 *
 * Optional ENV:
 *   REPLY_TO=kontakt@ai-agenturparisi.de
 */
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const { sendCustomerEmail } = require("./email_notifications");

const app = express();

// health
app.get("/health", (_, res) => res.status(200).send("ok"));

// parse json
app.use(bodyParser.json({ limit: "2mb" }));
// parse application/x-www-form-urlencoded (Twilio webhooks)
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * POST /api/lead
 * Body: { name, email, phone, message, source }
 * Sends a notification email to your own inbox (TO_MAIL)
 */
app.post("/api/lead", async (req, res) => {
  try {
    const { name, email, phone, message, source } = req.body || {};
    const to = process.env.TO_MAIL || process.env.FROM_MAIL; // fallback
    if (!to) return res.status(500).json({ ok: false, error: "Missing TO_MAIL or FROM_MAIL" });

    const subject = `Neue Anfrage${name ? " von " + name : ""}`;
    const text =
`Neue Anfrage:
Name: ${name || "-"}
Email: ${email || "-"}
Telefon: ${phone || "-"}
Quelle: ${source || "-"}
Nachricht:
${message || "-"}`;

    await sendCustomerEmail(to, subject, null, text);

    return res.json({ ok: true });
  } catch (err) {
    console.error("lead error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

/**
 * POST /api/test-email
 * Body: { to }
 */
app.post("/api/test-email", async (req, res) => {
  try {
    const to = (req.body && req.body.to) || process.env.TO_MAIL || process.env.FROM_MAIL;
    if (!to) return res.status(500).json({ ok: false, error: "Missing to" });
    await sendCustomerEmail(to, "Test Email ✅", null, "Wenn du das siehst, klappt SMTP.");
    return res.json({ ok: true });
  } catch (err) {
    console.error("test-email error:", err);
    return res.status(500).json({ ok: false, error: "server_error" });
  }
});

const port = parseInt(process.env.PORT || "3000", 10);
// Twilio Voice webhook (TEST) – gibt garantiert Audio aus
app.post("/twilio/voice", (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="de-DE" voice="alice">
    Hallo! Hier ist der Parisi Test. Wenn du mich hörst, funktioniert Twilio Audio.
  </Say>
</Response>`;

  res.set("Content-Type", "text/xml");
  return res.status(200).send(twiml);
});

app.listen(port, () => console.log(`Server listening on ${port}`));
