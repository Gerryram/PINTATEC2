import Head from "next/head";
import { useState, useRef, useCallback } from "react";


const COLORS = {
  bg: "#0F1A14", surface: "#1A2820", card: "#243320",
  accent: "#C8F050", accentDark: "#96BB28", warm: "#F5A623",
  text: "#F0F7E8", muted: "#7A9E6A", border: "#2E4230", danger: "#FF6B4A",
  wa: "#25D366", waDark: "#128C7E",
};

const PAINT_CATALOG = {
  basic: { label:"BASIC", emoji:"🟡", price:"35–50", brands:["Comex Viniltex","Berel Económica","Pinturas Rex"], color:"#F5A623", warranty:"1 año", colors:["#FFFFFF","#F5F0E8","#E8D5B5","#D4C09A","#A8C4A2","#8FB8D0","#E8A87C","#D4857A","#9BA8C0","#C8B8D5"] },
  pro: { label:"PRO", emoji:"🔵", price:"65–90", brands:["Comex Selecta","Sherwin Loxon","Sayer Color Pro"], color:"#5BA8E5", warranty:"2 años", colors:["#FFFFFF","#EDF2F4","#D6E8F0","#B8D4E8","#8CBCD4","#F0EAD2","#E8D5A3","#D4B896","#C0A882","#A89070"] },
  premium: { label:"PREMIUM", emoji:"🔴", price:"110–160", brands:["Sherwin-Williams Resilience","Sayer Elastomérica","Comex Ultra"], color:"#E85D6B", warranty:"4 años", colors:["#FAFAFA","#F0F4F8","#E8EFF5","#D5E3EC","#F5ECD7","#EDD9B5","#E0C898","#F5D5D5","#ECC0C0","#D4A8A8"] },
};

const SERVICES = [
  { id:"exterior", label:"Pintura Exterior", icon:"🏠", base:55 },
  { id:"interior", label:"Pintura Interior", icon:"🛋️", base:45 },
  { id:"impermeable", label:"Impermeabilización", icon:"💧", base:80 },
  { id:"herreria", label:"Herrería & Rejas", icon:"🔩", base:120 },
  { id:"decorativo", label:"Acabados Decorativos", icon:"✨", base:180 },
];

const TIME_SLOTS = ["9:00 AM","10:00 AM","11:00 AM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── WhatsApp Utilities ────────────────────────────────────────────────────────

const WA_NUMBER = "526641234567";

function buildWAMessage(type, data = {}) {
  const { name, phone, address, date, time, service, tier, estimate, question } = data;
  const formattedDate = date ? `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}` : "";

  const messages = {
    appointment: `🎨 *PINTATEC — Nueva Cita*\n\n👤 *Cliente:* ${name}\n📱 *Teléfono:* ${phone}\n📍 *Domicilio:* ${address}\n\n📅 *Fecha:* ${formattedDate}\n🕐 *Hora:* ${time}\n\n🔧 *Servicio:* ${service?.label}\n🎨 *Nivel pintura:* ${tier?.label}\n💰 *Estimado:* $${estimate?.precio_min?.toLocaleString()}–$${estimate?.precio_max?.toLocaleString()} MXN\n\n_Visita generada desde app PINTATEC_`,
    quote_only: `🎨 *PINTATEC — Solicitud de Presupuesto*\n\n👤 *Cliente:* ${name || "No especificado"}\n📱 *Teléfono:* ${phone || "No especificado"}\n\n🔧 *Servicio:* ${service?.label}\n🎨 *Nivel:* ${tier?.label}\n📐 *Área est.:* ~${estimate?.area_estimada} m²\n💰 *Rango est.:* $${estimate?.precio_min?.toLocaleString()}–$${estimate?.precio_max?.toLocaleString()} MXN\n⏱️ *Tiempo:* ${estimate?.tiempo_estimado}\n\n_Enviado desde app PINTATEC_`,
    question: `🎨 *PINTATEC — Consulta*\n\n${question}\n\n_Enviado desde app PINTATEC_`,
    catalog: `🎨 *PINTATEC — Consulta de Catálogo*\n\nHola, vi el catálogo de pintura en la app y me interesa el nivel *${tier?.label}* (${tier?.brands?.[0]}).\n¿Podrían darme más información?\n\n_Enviado desde app PINTATEC_`,
  };
  return encodeURIComponent(messages[type] || messages.question);
}

function openWhatsApp(type, data) {
  const msg = buildWAMessage(type, data);
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
}

async function compressImage(base64, maxSizeKB = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxDim = 1200;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width *= ratio;
        height *= ratio;
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      let quality = 0.7;
      let result = canvas.toDataURL("image/jpeg", quality);
      while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.2) {
        quality -= 0.1;
        result = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(result.split(",")[1]);
    };
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:38, height:38, borderRadius:10, background:`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, boxShadow:`0 0 20px ${COLORS.accent}44` }}>🎨</div>
      <div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:3, color:COLORS.accent, lineHeight:1 }}>PINTATEC</div>
        <div style={{ fontSize:9, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase" }}>Tu casa, transformada</div>
      </div>
    </div>
  );
}

function WAButton({ label, onClick, style = {}, size = "normal" }) {
  const isSmall = size === "small";
  return (
    <button onClick={onClick} style={{
      background:`linear-gradient(135deg,${COLORS.wa},${COLORS.waDark})`,
      color:"#fff", border:"none", borderRadius: isSmall ? 10 : 14,
      padding: isSmall ? "10px 14px" : "16px 20px",
      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      fontWeight:700, fontSize: isSmall ? 13 : 15, cursor:"pointer",
      boxShadow:`0 6px 20px ${COLORS.wa}44`,
      ...style
    }}>
      <span style={{ fontSize: isSmall ? 16 : 20 }}>💬</span>
      {label}
    </button>
  );
}

function BottomNav({ screen, setScreen }) {
  const tabs = [
    { id:"home", icon:"🏠", label:"Inicio" },
    { id:"estimate", icon:"📸", label:"Presupuesto" },
    { id:"catalog", icon:"🎨", label:"Catálogo" },
    { id:"schedule", icon:"📅", label:"Agendar" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:`${COLORS.surface}EE`, backdropFilter:"blur(20px)", borderTop:`1px solid ${COLORS.border}`, display:"flex", padding:"10px 0 20px", zIndex:100 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => setScreen(t.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, color:screen===t.id?COLORS.accent:COLORS.muted, transition:"all 0.2s" }}>
          <span style={{ fontSize:20 }}>{t.icon}</span>
          <span style={{ fontSize:10, fontFamily:"monospace", letterSpacing:1, textTransform:"uppercase" }}>{t.label}</span>
          {screen===t.id && <div style={{ width:4, height:4, borderRadius:"50%", background:COLORS.accent }} />}
        </button>
      ))}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ setScreen }) {
  return (
    <div style={{ padding:"24px 20px 100px" }}>
      <div style={{ background:`linear-gradient(135deg,${COLORS.card},#1E3528)`, borderRadius:20, padding:24, marginBottom:20, border:`1px solid ${COLORS.border}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, borderRadius:"50%", background:`${COLORS.accent}15`, border:`1px solid ${COLORS.accent}30` }} />
        <div style={{ fontSize:12, color:COLORS.accent, letterSpacing:3, textTransform:"uppercase", marginBottom:8, fontFamily:"monospace" }}>✦ Cotización Instantánea con IA</div>
        <h1 style={{ margin:"0 0 8px", fontFamily:"'Bebas Neue',sans-serif", fontSize:36, color:COLORS.text, lineHeight:1.1 }}>TRANSFORMA<br/>TU FACHADA</h1>
        <p style={{ color:COLORS.muted, fontSize:13, marginBottom:20, lineHeight:1.6 }}>Sube una foto y obtén presupuesto en segundos. Sin llamadas, sin esperas.</p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => setScreen("estimate")} style={{ flex:2, background:`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`, color:COLORS.bg, border:"none", borderRadius:12, padding:"14px 16px", fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, cursor:"pointer", boxShadow:`0 8px 24px ${COLORS.accent}44` }}>
            📸 PRESUPUESTO IA
          </button>
          <WAButton label="WhatsApp" onClick={() => openWhatsApp("question", { question:"Hola, me interesa información sobre servicios de pintura." })} style={{ flex:1, padding:"14px 12px", fontSize:13 }} size="small" />
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        {[["500+","Casas pintadas"],["98%","Satisfacción"],["4 años","Garantía máx."]].map(([n,l]) => (
          <div key={l} style={{ background:COLORS.surface, borderRadius:14, padding:"14px 10px", textAlign:"center", border:`1px solid ${COLORS.border}` }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:COLORS.accent }}>{n}</div>
            <div style={{ fontSize:10, color:COLORS.muted, lineHeight:1.4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background:`${COLORS.wa}18`, border:`1px solid ${COLORS.wa}44`, borderRadius:16, padding:16, marginBottom:20, display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ fontSize:36 }}>💬</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, color:COLORS.text, fontSize:14, marginBottom:2 }}>Atención por WhatsApp</div>
          <div style={{ color:COLORS.muted, fontSize:12, lineHeight:1.5 }}>Respuesta en menos de 1 hora · Lun–Sáb 8am–7pm</div>
        </div>
        <WAButton label="Chatear" onClick={() => openWhatsApp("question", { question:"Hola, quiero información sobre pintura de mi casa." })} size="small" style={{ whiteSpace:"nowrap" }} />
      </div>

      <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:3, textTransform:"uppercase", fontFamily:"monospace", marginBottom:12 }}>Nuestros Servicios</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {SERVICES.map(s => (
          <div key={s.id} style={{ background:COLORS.surface, borderRadius:12, padding:"14px 16px", border:`1px solid ${COLORS.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:22 }}>{s.icon}</span>
              <div>
                <div style={{ color:COLORS.text, fontSize:14, fontWeight:600 }}>{s.label}</div>
                <div style={{ color:COLORS.muted, fontSize:11 }}>desde ${s.base} MXN/m²</div>
              </div>
            </div>
            <WAButton label="Cotizar" size="small" onClick={() => openWhatsApp("question", { question:`Hola, me interesa cotizar servicio de ${s.label.toLowerCase()}. ¿Pueden ayudarme?` })} style={{ padding:"8px 12px", fontSize:12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ESTIMATE ─────────────────────────────────────────────────────────────────
function EstimateScreen({ setScreen, setAppointmentData }) {
  const [stage, setStage] = useState("upload");
  const [selectedService, setSelectedService] = useState("exterior");
  const [selectedTier, setSelectedTier] = useState("pro");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      setImagePreview(e.target.result);
      const compressed = await compressImage(e.target.result.split(",")[1]);
      setImageBase64(compressed);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzeWithAI = async () => {
    setStage("analyzing");
    setError(null);
    try {
      const service = SERVICES.find(s => s.id === selectedService);
      const tier = PAINT_CATALOG[selectedTier];
      let messages;
      if (imageBase64) {
        messages = [{ role:"user", content:[
          { type:"image", source:{ type:"base64", media_type:"image/jpeg", data:imageBase64 } },
          { type:"text", text:`Eres experto en presupuestos de pintura residencial en Tijuana, México. Analiza esta imagen y estima: área aproximada visible en m², estado de superficie, capas recomendadas, observaciones. Nivel: ${tier.label} (${tier.brands[0]}) precio base $${tier.price}/m². Servicio: ${service.label}. Responde SOLO en JSON sin markdown: {"area_estimada":45,"estado":"regular","capas":2,"precio_min":2800,"precio_max":3600,"observaciones":["obs1","obs2"],"tiempo_estimado":"2 días","confianza":"media"}` }
        ]}];
      } else {
        messages = [{ role:"user", content:`Genera presupuesto de ejemplo para ${service.label.toLowerCase()} en Tijuana con pintura ${tier.label} (${tier.brands[0]}, precio base $${tier.price}/m²). Responde SOLO en JSON sin markdown: {"area_estimada":60,"estado":"regular","capas":2,"precio_min":3500,"precio_max":5200,"observaciones":["superficie en buen estado","requiere sellador previo"],"tiempo_estimado":"2-3 días","confianza":"demo"}` }];
      }
      const response = await fetch("/api/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ messages }) });
      const data = await response.json();
      const text = data.content?.find(b => b.type==="text")?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g,"").trim());
      setResult({ ...parsed, service, tier });
      setStage("result");
    } catch (err) {       setError("Error: " + err?.message + " | status: " + (err?.status || "?"));       setStage("upload");     }
      setError("No se pudo analizar. Intenta nuevamente.");
      setStage("upload");
    }
  };

  if (stage === "analyzing") return (
    <div style={{ padding:"60px 20px", textAlign:"center" }}>
      <div style={{ fontSize:60, marginBottom:20, display:"inline-block", animation:"spin 2s linear infinite" }}>🔍</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:COLORS.accent, marginBottom:8 }}>ANALIZANDO CON IA</div>
      <div style={{ color:COLORS.muted, fontSize:13 }}>Calculando área, materiales y costo...</div>
      <div style={{ marginTop:30, display:"flex", justifyContent:"center", gap:6 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:COLORS.accent, animation:`pulse 1.2s ease-in-out ${i*0.4}s infinite` }} />)}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:0.2;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  );

  if (stage === "result" && result) {
    const service = result.service;
    const tier = result.tier;
    return (
      <div style={{ padding:"20px 20px 120px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button onClick={() => setStage("upload")} style={{ background:COLORS.surface, border:`1px solid ${COLORS.border}`, color:COLORS.text, borderRadius:10, padding:"8px 12px", cursor:"pointer", fontSize:16 }}>←</button>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:COLORS.text, letterSpacing:2 }}>PRESUPUESTO ESTIMADO</div>
        </div>

        {imagePreview && <div style={{ borderRadius:14, overflow:"hidden", marginBottom:16, height:150 }}><img src={imagePreview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>}

        <div style={{ background:`linear-gradient(135deg,${COLORS.card},#1E3528)`, borderRadius:20, padding:22, marginBottom:14, textAlign:"center", border:`1px solid ${COLORS.accent}44` }}>
          <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:3, textTransform:"uppercase", fontFamily:"monospace", marginBottom:6 }}>Rango estimado</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:44, color:COLORS.accent, lineHeight:1 }}>${result.precio_min?.toLocaleString()} – ${result.precio_max?.toLocaleString()}</div>
          <div style={{ color:COLORS.muted, fontSize:12, marginTop:4 }}>MXN · Incluye mano de obra y materiales</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          {[["📐","Área est.",`~${result.area_estimada} m²`],["🎨","Pintura",tier.label],["🖌️","Capas",`${result.capas} manos`],["⏱️","Tiempo",result.tiempo_estimado]].map(([ic,lb,vl]) => (
            <div key={lb} style={{ background:COLORS.surface, borderRadius:12, padding:14, border:`1px solid ${COLORS.border}` }}>
              <div style={{ fontSize:18, marginBottom:4 }}>{ic}</div>
              <div style={{ fontSize:10, color:COLORS.muted, textTransform:"uppercase", letterSpacing:1 }}>{lb}</div>
              <div style={{ fontSize:14, color:COLORS.text, fontWeight:700 }}>{vl}</div>
            </div>
          ))}
        </div>

        {result.observaciones?.length > 0 && (
          <div style={{ background:COLORS.surface, borderRadius:14, padding:16, marginBottom:16, border:`1px solid ${COLORS.border}` }}>
            <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:10 }}>Observaciones IA</div>
            {result.observaciones.map((o,i) => <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}><span style={{ color:COLORS.accent }}>▸</span><span style={{ color:COLORS.text, fontSize:13 }}>{o}</span></div>)}
          </div>
        )}

        {result.confianza === "demo" && <div style={{ background:`${COLORS.warm}22`, border:`1px solid ${COLORS.warm}44`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:COLORS.warm }}>⚠️ Modo demo — sube una foto real para mayor precisión</div>}

        <button onClick={() => { setAppointmentData({ service, tier, estimate:result }); setScreen("schedule"); }} style={{ width:"100%", background:`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`, color:COLORS.bg, border:"none", borderRadius:14, padding:"16px", fontFamily:"'Bebas Neue',sans-serif", fontSize:19, letterSpacing:3, cursor:"pointer", boxShadow:`0 8px 24px ${COLORS.accent}44`, marginBottom:10 }}>
          📅 AGENDAR VISITA GRATUITA
        </button>
        <WAButton
          label="Enviar presupuesto por WhatsApp"
          onClick={() => openWhatsApp("quote_only", { service, tier, estimate:result })}
          style={{ width:"100%", marginBottom:8, justifyContent:"center" }}
        />
        <div style={{ textAlign:"center", color:COLORS.muted, fontSize:12 }}>Un especialista confirmará el presupuesto exacto en tu domicilio</div>
      </div>
    );
  }

  return (
    <div style={{ padding:"24px 20px 120px" }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:COLORS.text, letterSpacing:2, marginBottom:4 }}>NUEVO PRESUPUESTO</div>
      <div style={{ color:COLORS.muted, fontSize:13, marginBottom:24 }}>Sube una foto y la IA calcula en segundos</div>

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:10 }}>1. Tipo de servicio</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {SERVICES.map(s => (
            <button key={s.id} onClick={() => setSelectedService(s.id)} style={{ background:selectedService===s.id?`${COLORS.accent}22`:COLORS.surface, border:`1px solid ${selectedService===s.id?COLORS.accent:COLORS.border}`, borderRadius:12, padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, color:COLORS.text, textAlign:"left", transition:"all 0.2s" }}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <div style={{ flex:1 }}><div style={{ fontSize:14, fontWeight:600 }}>{s.label}</div><div style={{ fontSize:11, color:COLORS.muted }}>desde ${s.base} MXN/m²</div></div>
              {selectedService===s.id && <span style={{ color:COLORS.accent }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:10 }}>2. Calidad de pintura</div>
        <div style={{ display:"flex", gap:8 }}>
          {Object.entries(PAINT_CATALOG).map(([key,tier]) => (
            <button key={key} onClick={() => setSelectedTier(key)} style={{ flex:1, background:selectedTier===key?`${tier.color}22`:COLORS.surface, border:`2px solid ${selectedTier===key?tier.color:COLORS.border}`, borderRadius:12, padding:"12px 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, transition:"all 0.2s" }}>
              <span style={{ fontSize:20 }}>{tier.emoji}</span>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, color:tier.color, letterSpacing:1 }}>{tier.label}</span>
              <span style={{ fontSize:10, color:COLORS.muted }}>${tier.price}/m²</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:10 }}>3. Foto (recomendada para mayor precisión)</div>
        <div onClick={() => fileRef.current?.click()} style={{ background:COLORS.surface, borderRadius:16, padding:28, border:`2px dashed ${imagePreview?COLORS.accent:COLORS.border}`, textAlign:"center", cursor:"pointer" }}>
          {imagePreview ? (
            <><img src={imagePreview} alt="" style={{ width:"100%", height:140, objectFit:"cover", borderRadius:10, marginBottom:8 }} /><div style={{ color:COLORS.accent, fontSize:13 }}>✓ Foto cargada — toca para cambiar</div></>
          ) : (
            <><div style={{ fontSize:44, marginBottom:8 }}>📸</div><div style={{ color:COLORS.text, fontSize:15, fontWeight:600 }}>Toca para subir foto</div><div style={{ color:COLORS.muted, fontSize:12 }}>JPG, PNG · Foto de fachada o área a pintar</div></>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
      </div>

      {error && <div style={{ color:COLORS.danger, fontSize:13, marginBottom:12, textAlign:"center" }}>{error}</div>}

      <button onClick={analyzeWithAI} style={{ width:"100%", background:`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`, color:COLORS.bg, border:"none", borderRadius:14, padding:"18px", fontFamily:"'Bebas Neue',sans-serif", fontSize:19, letterSpacing:3, cursor:"pointer", boxShadow:`0 8px 24px ${COLORS.accent}44`, marginBottom:10 }}>
        {imagePreview ? "🔍 ANALIZAR Y PRESUPUESTAR" : "💡 GENERAR PRESUPUESTO DEMO"}
      </button>
      <WAButton label="Prefiero cotizar por WhatsApp" onClick={() => openWhatsApp("question", { question:"Hola, quiero un presupuesto de pintura para mi casa en Tijuana." })} style={{ width:"100%", justifyContent:"center" }} />
    </div>
  );
}

// ─── CATALOG ──────────────────────────────────────────────────────────────────
function CatalogScreen() {
  const [activeTier, setActiveTier] = useState("pro");
  const tier = PAINT_CATALOG[activeTier];

  return (
    <div style={{ padding:"24px 20px 120px" }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:COLORS.text, letterSpacing:2, marginBottom:4 }}>CATÁLOGO DE PINTURAS</div>
      <div style={{ color:COLORS.muted, fontSize:13, marginBottom:20 }}>Elige el nivel que mejor se adapta a tu presupuesto</div>

      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {Object.entries(PAINT_CATALOG).map(([key,t]) => (
          <button key={key} onClick={() => setActiveTier(key)} style={{ flex:1, padding:"10px 6px", borderRadius:12, cursor:"pointer", border:`2px solid ${activeTier===key?t.color:COLORS.border}`, background:activeTier===key?`${t.color}22`:COLORS.surface, transition:"all 0.2s" }}>
            <div style={{ fontSize:18 }}>{t.emoji}</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:t.color, letterSpacing:1 }}>{t.label}</div>
          </button>
        ))}
      </div>

      <div style={{ background:`linear-gradient(135deg,${COLORS.card},#1E3528)`, borderRadius:20, padding:22, marginBottom:20, border:`1px solid ${tier.color}44` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:tier.color, letterSpacing:2 }}>{tier.emoji} {tier.label}</div>
            <div style={{ color:COLORS.muted, fontSize:13, lineHeight:1.6, maxWidth:200 }}>{tier.warranty} de garantía incluida</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:COLORS.muted }}>desde</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:tier.color }}>${tier.price}</div>
            <div style={{ fontSize:10, color:COLORS.muted }}>MXN/m²</div>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          {tier.brands.map(b => <div key={b} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}><div style={{ width:6, height:6, borderRadius:"50%", background:tier.color }} /><span style={{ color:COLORS.text, fontSize:13 }}>{b}</span></div>)}
        </div>
        <WAButton label={`Cotizar pintura ${tier.label}`} onClick={() => openWhatsApp("catalog", { tier })} style={{ width:"100%" }} />
      </div>

      <div>
        <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:12 }}>Colores populares</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
          {tier.colors.map((c,i) => <div key={i} style={{ aspectRatio:"1", borderRadius:12, background:c, border:`1px solid ${COLORS.border}`, boxShadow:`0 4px 12px ${c}44`, cursor:"pointer" }} />)}
        </div>
        <div style={{ color:COLORS.muted, fontSize:11, textAlign:"center", marginTop:10 }}>+200 colores · Ver catálogo completo en visita domiciliaria</div>
      </div>

      <div style={{ marginTop:24 }}>
        <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:12 }}>Comparativa de niveles</div>
        <div style={{ background:COLORS.surface, borderRadius:14, overflow:"hidden", border:`1px solid ${COLORS.border}` }}>
          {[["Lavable","✓","✓","✓"],["Antimoho","—","✓","✓"],["Elastomérica","—","—","✓"],["UV-Resistente","—","✓","✓"],["Impermeable","—","Parcial","✓"]].map(([f,...vals],i) => (
            <div key={f} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"12px 14px", borderBottom:i<4?`1px solid ${COLORS.border}`:"none", background:i%2===0?"transparent":`${COLORS.bg}44` }}>
              <div style={{ fontSize:12, color:COLORS.muted }}>{f}</div>
              {vals.map((v,j) => { const tc = Object.values(PAINT_CATALOG)[j].color; return <div key={j} style={{ textAlign:"center", fontSize:12, color:v==="✓"?tc:v==="—"?COLORS.border:COLORS.warm }}>{v}</div>; })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
function ScheduleScreen({ appointmentData }) {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [booked, setBooked] = useState(false);

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate()+i+1); return d; }).filter(d => d.getDay() !== 0);

  const handleConfirm = async () => {
    setBooked(true);
    const dateStr = selectedDate ? `${DAY_NAMES[selectedDate.getDay()]} ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}` : "";
    try {
      await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, date: dateStr, time: selectedTime, service: appointmentData?.service, tier: appointmentData?.tier, estimate: appointmentData?.estimate }),
      });
    } catch { /* Silent — WhatsApp is fallback */ }
    setTimeout(() => {
      openWhatsApp("appointment", { name, phone, address, date:selectedDate, time:selectedTime, service:appointmentData?.service, tier:appointmentData?.tier, estimate:appointmentData?.estimate });
    }, 1200);
  };

  if (booked) return (
    <div style={{ padding:"50px 20px", textAlign:"center" }}>
      <div style={{ fontSize:72, marginBottom:16 }}>✅</div>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:COLORS.accent, letterSpacing:2, marginBottom:8 }}>¡CITA AGENDADA!</div>
      <div style={{ color:COLORS.text, fontSize:15, marginBottom:6 }}>
        {selectedDate && `${DAY_NAMES[selectedDate.getDay()]} ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}`} · {selectedTime}
      </div>
      <div style={{ color:COLORS.muted, fontSize:13, marginBottom:28 }}>Un especialista irá a tu domicilio</div>
      <div style={{ background:COLORS.surface, borderRadius:16, padding:20, marginBottom:20, textAlign:"left", border:`1px solid ${COLORS.border}` }}>
        {[["👤",name],["📱",phone],["📍",address]].map(([ic,vl]) => (
          <div key={ic} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:`1px solid ${COLORS.border}` }}>
            <span>{ic}</span><span style={{ color:COLORS.text, fontSize:13, fontWeight:600 }}>{vl}</span>
          </div>
        ))}
      </div>
      <div style={{ background:`${COLORS.wa}18`, border:`1px solid ${COLORS.wa}44`, borderRadius:16, padding:18, marginBottom:16 }}>
        <div style={{ fontSize:13, color:COLORS.text, fontWeight:700, marginBottom:6 }}>💬 Confirmación por WhatsApp</div>
        <div style={{ fontSize:12, color:COLORS.muted, marginBottom:14, lineHeight:1.6 }}>Se abrirá WhatsApp con el resumen de tu cita. Envíalo para confirmar con nuestro equipo.</div>
        <WAButton label="Confirmar por WhatsApp ahora" onClick={() => openWhatsApp("appointment", { name, phone, address, date:selectedDate, time:selectedTime, service:appointmentData?.service, tier:appointmentData?.tier, estimate:appointmentData?.estimate })} style={{ width:"100%", justifyContent:"center" }} />
      </div>
      <div style={{ color:COLORS.muted, fontSize:11 }}>Servicio de visita 100% gratuito · Sin compromiso</div>
    </div>
  );

  return (
    <div style={{ padding:"24px 20px 120px" }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:COLORS.text, letterSpacing:2, marginBottom:4 }}>AGENDAR VISITA</div>
      <div style={{ color:COLORS.muted, fontSize:13, marginBottom:20 }}>Visita gratuita · Presupuesto exacto · Sin compromiso</div>

      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {["Fecha","Hora","Datos","Confirmar"].map((s,i) => (
          <div key={s} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:"100%", height:3, borderRadius:2, background:i<step?COLORS.accent:COLORS.border, transition:"background 0.3s" }} />
            <div style={{ fontSize:9, color:i<step?COLORS.accent:COLORS.muted, textTransform:"uppercase", letterSpacing:1 }}>{s}</div>
          </div>
        ))}
      </div>

      {appointmentData && (
        <div style={{ background:`${COLORS.accent}15`, border:`1px solid ${COLORS.accent}33`, borderRadius:12, padding:"10px 14px", marginBottom:20, fontSize:12, color:COLORS.accent }}>
          📋 {appointmentData.service?.label} · {appointmentData.tier?.label} · Est. ${appointmentData.estimate?.precio_min?.toLocaleString()}–${appointmentData.estimate?.precio_max?.toLocaleString()} MXN
        </div>
      )}

      {step===1 && (
        <div>
          <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:14 }}>Selecciona una fecha</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
            {days.slice(0,12).map((d,i) => (
              <button key={i} onClick={() => setSelectedDate(d)} style={{ background:selectedDate?.toDateString()===d.toDateString()?`${COLORS.accent}22`:COLORS.surface, border:`2px solid ${selectedDate?.toDateString()===d.toDateString()?COLORS.accent:COLORS.border}`, borderRadius:12, padding:"10px 6px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, transition:"all 0.15s" }}>
                <div style={{ fontSize:9, color:COLORS.muted, textTransform:"uppercase", letterSpacing:1 }}>{DAY_NAMES[d.getDay()]}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:selectedDate?.toDateString()===d.toDateString()?COLORS.accent:COLORS.text }}>{d.getDate()}</div>
                <div style={{ fontSize:9, color:COLORS.muted }}>{MONTH_NAMES[d.getMonth()]}</div>
              </button>
            ))}
          </div>
          <button onClick={() => selectedDate && setStep(2)} style={{ width:"100%", background:selectedDate?`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`:COLORS.border, color:COLORS.bg, border:"none", borderRadius:14, padding:"16px", fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:2, cursor:selectedDate?"pointer":"not-allowed" }}>
            CONTINUAR →
          </button>
        </div>
      )}

      {step===2 && (
        <div>
          <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:14 }}>Selecciona un horario</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {TIME_SLOTS.map(t => (
              <button key={t} onClick={() => setSelectedTime(t)} style={{ background:selectedTime===t?`${COLORS.accent}22`:COLORS.surface, border:`2px solid ${selectedTime===t?COLORS.accent:COLORS.border}`, borderRadius:12, padding:"14px 18px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", color:selectedTime===t?COLORS.accent:COLORS.text, fontSize:15, fontWeight:600, transition:"all 0.15s" }}>
                <span>🕐 {t}</span>
                {selectedTime===t && <span>✓</span>}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setStep(1)} style={{ flex:1, background:COLORS.surface, border:`1px solid ${COLORS.border}`, color:COLORS.text, borderRadius:14, padding:"14px", cursor:"pointer" }}>← Atrás</button>
            <button onClick={() => selectedTime && setStep(3)} style={{ flex:2, background:selectedTime?`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`:COLORS.border, color:COLORS.bg, border:"none", borderRadius:14, padding:"14px", fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:2, cursor:selectedTime?"pointer":"not-allowed" }}>
              CONTINUAR →
            </button>
          </div>
        </div>
      )}

      {step===3 && (
        <div>
          <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:14 }}>Tus datos de contacto</div>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
            {[["👤 Nombre",name,setName,"Ej: Carlos Mendoza"],["📱 WhatsApp",phone,setPhone,"Ej: 664 123 4567"],["📍 Dirección en Tijuana",address,setAddress,"Ej: Calle, Col., Delegación"]].map(([lb,vl,st,ph]) => (
              <div key={lb}><div style={{ fontSize:12, color:COLORS.muted, marginBottom:6 }}>{lb}</div><input value={vl} onChange={e => st(e.target.value)} placeholder={ph} style={{ width:"100%", background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"14px", color:COLORS.text, fontSize:14, outline:"none", boxSizing:"border-box" }} /></div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setStep(2)} style={{ flex:1, background:COLORS.surface, border:`1px solid ${COLORS.border}`, color:COLORS.text, borderRadius:14, padding:"14px", cursor:"pointer" }}>← Atrás</button>
            <button onClick={() => (name&&phone&&address)&&setStep(4)} style={{ flex:2, background:(name&&phone&&address)?`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`:COLORS.border, color:COLORS.bg, border:"none", borderRadius:14, padding:"14px", fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:2, cursor:(name&&phone&&address)?"pointer":"not-allowed" }}>
              REVISAR →
            </button>
          </div>
        </div>
      )}

      {step===4 && (
        <div>
          <div style={{ fontSize:11, color:COLORS.muted, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", marginBottom:14 }}>Confirma tu cita</div>
          <div style={{ background:COLORS.surface, borderRadius:16, padding:20, marginBottom:16, border:`1px solid ${COLORS.border}` }}>
            {[["📅 Fecha",`${DAY_NAMES[selectedDate?.getDay()]} ${selectedDate?.getDate()} ${MONTH_NAMES[selectedDate?.getMonth()]}`],["🕐 Hora",selectedTime],["👤 Nombre",name],["📱 Teléfono",phone],["📍 Domicilio",address]].map(([l,v]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${COLORS.border}` }}>
                <span style={{ color:COLORS.muted, fontSize:13 }}>{l}</span>
                <span style={{ color:COLORS.text, fontSize:13, fontWeight:600, maxWidth:180, textAlign:"right" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background:`${COLORS.wa}18`, border:`1px solid ${COLORS.wa}33`, borderRadius:12, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ fontSize:20 }}>💬</span>
            <div style={{ fontSize:12, color:COLORS.muted, lineHeight:1.6 }}>Al confirmar, se abrirá WhatsApp con el resumen de tu cita para que lo envíes directamente a nuestro equipo.</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setStep(3)} style={{ flex:1, background:COLORS.surface, border:`1px solid ${COLORS.border}`, color:COLORS.text, borderRadius:14, padding:"14px", cursor:"pointer" }}>← Editar</button>
            <button onClick={handleConfirm} style={{ flex:2, background:`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`, color:COLORS.bg, border:"none", borderRadius:14, padding:"16px", fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:2, cursor:"pointer", boxShadow:`0 8px 24px ${COLORS.accent}44` }}>
              ✅ CONFIRMAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [appointmentData, setAppointmentData] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const captureInstall = useCallback(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); setShowInstallBanner(true); };
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handler);
    }
  }, []);

  useState(() => { captureInstall(); }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setShowInstallBanner(false);
  };

  return (
    <>
      <Head>
        <title>PINTATEC — Tu casa, transformada</title>
        <meta name="description" content="Cotización instantánea con IA para pintura residencial en Tijuana. Presupuesto en segundos." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0F1A14" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ background:COLORS.bg, minHeight:"100vh", maxWidth:430, margin:"0 auto", fontFamily:"'Segoe UI',system-ui,sans-serif", color:COLORS.text, position:"relative" }}>
        <style>{`*{box-sizing:border-box} button{font-family:inherit} input::placeholder{color:#4a6a5a} ::-webkit-scrollbar{width:0}`}</style>
        <div style={{ padding:"18px 20px 14px", borderBottom:`1px solid ${COLORS.border}`, background:`${COLORS.bg}EE`, backdropFilter:"blur(20px)", position:"sticky", top:0, zIndex:50, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <Logo />
          <div style={{ background:`${COLORS.wa}22`, border:`1px solid ${COLORS.wa}44`, borderRadius:10, padding:"6px 12px", fontSize:11, color:COLORS.wa, fontFamily:"monospace", letterSpacing:1, cursor:"pointer" }} onClick={() => openWhatsApp("question",{question:"Hola, necesito información sobre sus servicios de pintura."})}>
            💬 664 123 4567
          </div>
        </div>
        <div style={{ overflowY:"auto", maxHeight:"calc(100vh - 68px)" }}>
          {screen==="home" && <HomeScreen setScreen={setScreen} />}
          {screen==="estimate" && <EstimateScreen setScreen={setScreen} setAppointmentData={setAppointmentData} />}
          {screen==="catalog" && <CatalogScreen />}
          {screen==="schedule" && <ScheduleScreen appointmentData={appointmentData} />}
        </div>
        {showInstallBanner && (
          <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:398, background:`${COLORS.card}F5`, backdropFilter:"blur(20px)", border:`1px solid ${COLORS.accent}44`, borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, zIndex:200, boxShadow:`0 8px 32px #00000088` }}>
            <span style={{ fontSize:28 }}>📲</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:COLORS.text }}>Instalar PINTATEC</div>
              <div style={{ fontSize:11, color:COLORS.muted }}>Acceso rápido desde tu pantalla de inicio</div>
            </div>
            <button onClick={handleInstall} style={{ background:`linear-gradient(135deg,${COLORS.accent},${COLORS.accentDark})`, color:COLORS.bg, border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Instalar</button>
            <button onClick={() => setShowInstallBanner(false)} style={{ background:"none", border:"none", color:COLORS.muted, fontSize:18, cursor:"pointer", padding:4 }}>×</button>
          </div>
        )}
        <BottomNav screen={screen} setScreen={setScreen} />
      </div>
    </>
  );
}
