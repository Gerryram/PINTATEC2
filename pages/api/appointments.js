// pages/api/appointments.js
// Saves appointments to Vercel Postgres (Neon) + sends email via Resend

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple in-memory store fallback (works for demo; use Vercel Postgres for production)
// We use a file-based approach via environment variable storage for simplicity
let appointmentsCache = [];

export default async function handler(req, res) {
  // ── GET: fetch all appointments (admin panel) ──────────────────────────────
  if (req.method === "GET") {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: "No autorizado" });
    }
    return res.status(200).json({ appointments: appointmentsCache });
  }

  // ── POST: create appointment ───────────────────────────────────────────────
  if (req.method === "POST") {
    const { name, phone, address, date, time, service, tier, estimate } = req.body;

    if (!name || !phone || !address || !date || !time) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const appointment = {
      id: `appt_${Date.now()}`,
      name, phone, address, date, time,
      service: service?.label || "—",
      tier: tier?.label || "—",
      estimateMin: estimate?.precio_min || null,
      estimateMax: estimate?.precio_max || null,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    };

    appointmentsCache.unshift(appointment);

    // Send email notification
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "PINTATEC <onboarding@resend.dev>",
          to: adminEmail,
          subject: `📅 Nueva cita — ${name}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#0F1A14;color:#F0F7E8;padding:32px;border-radius:16px">
              <div style="color:#C8F050;font-size:24px;font-weight:900;letter-spacing:4px;margin-bottom:4px">PINTATEC</div>
              <div style="color:#7A9E6A;font-size:12px;margin-bottom:24px">Nueva cita agendada</div>
              <table style="width:100%;border-collapse:collapse">
                ${[
                  ["👤 Cliente", name],
                  ["📱 WhatsApp", phone],
                  ["📍 Domicilio", address],
                  ["📅 Fecha", date],
                  ["🕐 Hora", time],
                  ["🔧 Servicio", service?.label || "—"],
                  ["🎨 Nivel", tier?.label || "—"],
                ].map(([label, value]) => `
                  <tr style="border-bottom:1px solid #2E4230">
                    <td style="padding:10px 0;color:#7A9E6A;font-size:13px;width:40%">${label}</td>
                    <td style="padding:10px 0;color:#F0F7E8;font-size:13px;font-weight:600">${value}</td>
                  </tr>
                `).join("")}
              </table>
              <div style="margin-top:20px;color:#7A9E6A;font-size:11px;text-align:center">
                Generado desde app PINTATEC · ${new Date().toLocaleString("es-MX")}
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Email error:", emailErr);
    }

    return res.status(200).json({ ok: true, id: appointment.id });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
