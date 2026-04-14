import { useState } from "react";
import Head from "next/head";

const C = {
  bg: "#0F1A14", surface: "#1A2820", card: "#243320",
  accent: "#C8F050", accentDark: "#96BB28",
  text: "#F0F7E8", muted: "#7A9E6A", border: "#2E4230",
  danger: "#FF6B4A", wa: "#25D366",
};

const STATUS_COLORS = {
  pendiente: "#F5A623",
  confirmada: "#C8F050",
  completada: "#25D366",
  cancelada: "#FF6B4A",
};

export default function Admin() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("todas");
  const [adminKey, setAdminKey] = useState("");

  const login = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        headers: { "x-admin-key": password },
      });
      if (!res.ok) {
        setError("Contraseña incorrecta");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setAppointments(data.appointments || []);
      setAdminKey(password);
      setAuthed(true);
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    // Optimistic update only — extend API to PATCH if needed
  };

  const filtered = filter === "todas"
    ? appointments
    : appointments.filter((a) => a.status === filter);

  if (!authed) {
    return (
      <>
        <Head>
          <title>Admin — PINTATEC</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
          <div style={{ width:"100%", maxWidth:380, background:C.surface, borderRadius:20, padding:32, border:`1px solid ${C.border}` }}>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🎨</div>
              <div style={{ fontFamily:"monospace", fontSize:22, fontWeight:900, letterSpacing:4, color:C.accent }}>PINTATEC</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4, letterSpacing:2, textTransform:"uppercase" }}>Panel de Administración</div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:C.muted, display:"block", marginBottom:8, letterSpacing:1 }}>CONTRASEÑA ADMIN</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                placeholder="••••••••"
                style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}
              />
            </div>

            {error && (
              <div style={{ background:`${C.danger}22`, border:`1px solid ${C.danger}44`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.danger, marginBottom:16 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={login}
              disabled={loading || !password}
              style={{ width:"100%", background:password ? `linear-gradient(135deg,${C.accent},${C.accentDark})` : C.border, color:C.bg, border:"none", borderRadius:12, padding:"16px", fontFamily:"monospace", fontSize:16, fontWeight:900, letterSpacing:3, cursor:password ? "pointer" : "not-allowed" }}
            >
              {loading ? "VERIFICANDO..." : "ENTRAR →"}
            </button>
          </div>
        </div>
      </>
    );
  }

  const counts = {
    todas: appointments.length,
    pendiente: appointments.filter((a) => a.status === "pendiente").length,
    confirmada: appointments.filter((a) => a.status === "confirmada").length,
    completada: appointments.filter((a) => a.status === "completada").length,
  };

  return (
    <>
      <Head>
        <title>Admin — PINTATEC</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Segoe UI',system-ui,sans-serif", color:C.text }}>
        {/* Header */}
        <div style={{ background:`${C.surface}EE`, backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:50 }}>
          <div>
            <span style={{ fontFamily:"monospace", fontWeight:900, letterSpacing:4, color:C.accent, fontSize:20 }}>PINTATEC</span>
            <span style={{ color:C.muted, fontSize:12, marginLeft:12, letterSpacing:2, textTransform:"uppercase" }}>Admin</span>
          </div>
          <div style={{ display:"flex", gap:16, alignItems:"center" }}>
            <div style={{ fontSize:13, color:C.muted }}>{appointments.length} citas totales</div>
            <button onClick={() => setAuthed(false)} style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted, borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>
              Salir
            </button>
          </div>
        </div>

        <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 20px" }}>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
            {[
              ["Total", counts.todas, C.accent],
              ["Pendientes", counts.pendiente, "#F5A623"],
              ["Confirmadas", counts.confirmada, C.accent],
              ["Completadas", counts.completada, C.wa],
            ].map(([label, count, color]) => (
              <div key={label} style={{ background:C.surface, borderRadius:14, padding:"16px", border:`1px solid ${C.border}`, textAlign:"center" }}>
                <div style={{ fontFamily:"monospace", fontSize:28, fontWeight:900, color }}>{count}</div>
                <div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
            {["todas","pendiente","confirmada","completada","cancelada"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{ background:filter===f ? `${C.accent}22` : C.surface, border:`1px solid ${filter===f ? C.accent : C.border}`, color:filter===f ? C.accent : C.muted, borderRadius:20, padding:"8px 16px", fontSize:12, fontFamily:"monospace", letterSpacing:1, textTransform:"uppercase", cursor:"pointer" }}>
                {f}
              </button>
            ))}
          </div>

          {/* Appointments list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:C.muted }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
              <div>No hay citas {filter !== "todas" ? `con estado "${filter}"` : "registradas"}</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {filtered.map((appt) => (
                <div key={appt.id} style={{ background:C.surface, borderRadius:16, padding:"20px", border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:16, marginBottom:2 }}>{appt.name}</div>
                      <div style={{ fontSize:12, color:C.muted }}>{new Date(appt.createdAt).toLocaleString("es-MX")}</div>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ background:`${STATUS_COLORS[appt.status]}22`, border:`1px solid ${STATUS_COLORS[appt.status]}55`, color:STATUS_COLORS[appt.status], borderRadius:20, padding:"4px 12px", fontSize:11, fontFamily:"monospace", letterSpacing:1, textTransform:"uppercase" }}>
                        {appt.status}
                      </span>
                      <a
                        href={`https://wa.me/${appt.phone?.replace(/\D/g,"")}?text=Hola+${encodeURIComponent(appt.name)}%2C+somos+PINTATEC.`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ background:`${C.wa}22`, border:`1px solid ${C.wa}44`, color:C.wa, borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:700, textDecoration:"none" }}
                      >
                        💬 WA
                      </a>
                    </div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:12 }}>
                    {[
                      ["📱 Teléfono", appt.phone],
                      ["📍 Domicilio", appt.address],
                      ["📅 Fecha", appt.date],
                      ["🕐 Hora", appt.time],
                      ["🔧 Servicio", appt.service],
                      ["🎨 Nivel", appt.tier],
                      appt.estimateMin && ["💰 Estimado", `$${appt.estimateMin?.toLocaleString()}–$${appt.estimateMax?.toLocaleString()} MXN`],
                    ].filter(Boolean).map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status updater */}
                  <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}`, display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, color:C.muted, alignSelf:"center", marginRight:4 }}>Cambiar estado:</span>
                    {["pendiente","confirmada","completada","cancelada"].map((s) => (
                      <button key={s} onClick={() => updateStatus(appt.id, s)} style={{ background:appt.status===s ? `${STATUS_COLORS[s]}33` : "none", border:`1px solid ${STATUS_COLORS[s]}55`, color:STATUS_COLORS[s], borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer", fontFamily:"monospace" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
