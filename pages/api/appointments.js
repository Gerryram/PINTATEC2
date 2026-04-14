// pages/api/appointments.js
// Saves appointment to Vercel KV + sends email notification via Resend

import { kv } from "@vercel/kv";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // ── GET: fetch all appointments (admin panel) ──────────────────────────────
  if (req.method === "GET") {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: "No autorizado" });
    }

    try {
      const keys = await kv.keys("appt:*");
      if (!keys.length) return res.status(200).json({ appointments: [] });

      const appointments = await Promise.all(
        keys.map((key) => kv.get(key))
      );

      // Sort newest first
      appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ appointments });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al obtener citas" });
    }
  }

  // ── POST: create appointment ───────────────────────────────────────────────
  if (req.method === "POST") {
    const { name, phone, address, date, time, service, tier, estimate } = req.body;

    if (!name || !phone || !address || !date || !time) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const id = `appt:${Date.now()}`;
    const appointment = {
      id,
      name,
      phone,
      address,
      date,
      time,
      service: service?.label || "—",
      tier: tier?.label || "—",
      estimateMin: estimate?.precio_min || null,
      estimateMax: estimate?.precio_max || null,
      status: "pendiente",
      createdAt: new Date().toISOString(),
    };

    try {
      // Save to Vercel KV (90 day TTL)
      await kv.set(id, appointment, { ex: 60 * 60 * 24 * 90 });

      // Send email notification
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "PINTATEC <notificaciones@pintatec.mx>",
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
                  ["🎨 Nivel pintura", tier?.label || "—"],
                  ["💰 Estimado", estimate ? `$${estimate.precio_min?.toLocaleString()}–$${estimate.precio_max?.toLocaleString()} MXN` : "—"],
                ].map(([label, value]) => `
                  <tr style="border-bottom:1px solid #2E4230">
                    <td style="padding:10px 0;color:#7A9E6A;font-size:13px;width:40%">${label}</td>
                    <td style="padding:10px 0;color:#F0F7E8;font-size:13px;font-weight:600">${value}</td>
                  </tr>
                `).join("")}
              </table>

              <div style="margin-top:24px;background:#25D36618;border:1px solid #25D36644;border-radius:12px;padding:16px">
                <a href="https://wa.me/${phone.replace(/\D/g, "")}?text=Hola+${encodeURIComponent(name)}%2C+confirmamos+tu+cita+de+PINTATEC+para+el+${encodeURIComponent(date)}+a+las+${encodeURIComponent(time)}." 
                   style="color:#25D366;font-weight:700;text-decoration:none;font-size:14px">
                  💬 Confirmar por WhatsApp →
                </a>
              </div>

              <div style="margin-top:20px;color:#7A9E6A;font-size:11px;text-align:center">
                Generado desde app PINTATEC · ${new Date().toLocaleString("es-MX")}
              </div>
            </div>
          `,
        });
      }

      return res.status(200).json({ ok: true, id });
    } catch (err) {
      console.error("Appointment error:", err);
      // Still return success — appointment may have saved even if email failed
      return res.status(200).json({ ok: true, id, emailError: true });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
