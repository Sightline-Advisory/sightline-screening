// ─────────────────────────────────────────────────────────────────────────────
//  Sightline Advisory — Screening Comercial Ejecutivo
//  App.jsx — versión con persistencia Supabase
//
//  Variables de entorno requeridas (.env.local):
//    VITE_SUPABASE_URL=https://xxxx.supabase.co
//    VITE_SUPABASE_ANON_KEY=eyJ...
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const _sbUrl = import.meta.env.VITE_SUPABASE_URL;
const _sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = (_sbUrl && _sbKey) ? createClient(_sbUrl, _sbKey) : null;

async function saveScreening(payload) {
  if (!supabase) { console.warn("Supabase no configurado — guardado omitido"); return null; }
  try {
    const { data, error } = await supabase.from("screenings").insert([payload]).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Error guardando en Supabase:", e.message);
    return null;
  }
}

// ─── INDUSTRY TAXONOMY ───────────────────────────────────────────────────────
const INDUSTRIES = {
  "Tecnología y Software": [
    "SaaS / Plataformas digitales", "Desarrollo a la medida", "Ciberseguridad",
    "Inteligencia Artificial / Data", "Hardware y dispositivos", "Telecomunicaciones",
    "Fintech", "Healthtech", "Edtech", "E-commerce / Marketplace",
  ],
  "Manufactura e Industria": [
    "Manufactura de consumo masivo", "Manufactura industrial / B2B",
    "Plásticos y empaques", "Metalmecánica", "Textil y confección",
    "Químicos e insumos industriales", "Automotriz y autopartes", "Energía y minería",
  ],
  "Servicios Profesionales y Consultoría": [
    "Consultoría estratégica / gerencial", "Servicios jurídicos",
    "Contabilidad y auditoría", "Recursos humanos y headhunting",
    "Publicidad y marketing", "Diseño y arquitectura", "Ingeniería y proyectos",
    "Outsourcing de procesos (BPO)",
  ],
  "Retail y Consumo": [
    "Retail físico multimarca", "Retail especializado / nicho",
    "Retail digital / DTC", "Franquicias", "Distribución mayorista",
    "Consumo masivo (FMCG)", "Lujo y premium",
  ],
  "Salud y Bienestar": [
    "Clínicas y hospitales privados", "Laboratorios diagnósticos",
    "Dispositivos médicos", "Farmacéutica y biotech",
    "Salud mental y bienestar", "Estética y medicina estética",
    "Seguros de salud", "Telemedicina",
  ],
  "Construcción y Real Estate": [
    "Constructoras residenciales", "Constructoras comerciales / industriales",
    "Inmobiliarias y fiducias", "Materiales de construcción",
    "Infraestructura y obras civiles", "Propiedad raíz y gestión de activos", "PropTech",
  ],
  "Alimentos y Bebidas": [
    "Producción agroindustrial", "Restaurantes y cadenas QSR",
    "Alimentos procesados", "Bebidas alcohólicas", "Bebidas no alcohólicas",
    "Snacks y confitería", "Catering y alimentación colectiva", "Exportación agroalimentaria",
  ],
  "Logística y Cadena de Suministro": [
    "Transporte terrestre de carga", "Logística última milla",
    "Almacenamiento y fulfillment", "Comercio exterior y aduanas",
    "Courier y paquetería", "Cold chain / cadena de frío", "Operadores logísticos 3PL/4PL",
  ],
  "Educación y Formación": [
    "Educación preescolar / básica / media", "Educación superior privada",
    "Formación técnica y vocacional", "Educación ejecutiva y corporativa",
    "Plataformas e-learning", "Tutorías y apoyos académicos", "Idiomas y certificaciones",
  ],
  "Agro, Ganadería e Insumos": [
    "Producción agrícola", "Ganadería y porcicultura",
    "Acuicultura y pesca", "Insumos agrícolas (fertilizantes, agroinsumos)",
    "Maquinaria agrícola", "Servicios agropecuarios", "Exportación de commodities",
  ],
  "Servicios Financieros": [
    "Banca y crédito", "Seguros generales y de vida",
    "Gestión de inversiones / family office", "Cooperativas y microfinanzas",
    "Leasing y factoring", "Corretaje y comisionistas de bolsa", "Pagos y medios de pago",
  ],
  "Turismo, Hotelería y Entretenimiento": [
    "Hoteles y resorts", "Agencias de viaje y operadores",
    "Restaurantes fine dining", "Entretenimiento y eventos",
    "Turismo de aventura / ecoturismo", "Parques temáticos y recreación",
    "Producción audiovisual y medios",
  ],
  "Energía y Medio Ambiente": [
    "Petróleo, gas y derivados", "Energía renovable (solar, eólica)",
    "Gestión de residuos y reciclaje", "Servicios ambientales y consultoría",
    "Agua y saneamiento", "Eficiencia energética",
  ],
  "Otro": ["Otro / Sector no listado"],
};

const OPERATION_SCOPES = [
  { value: "local",         label: "Local",         desc: "Una ciudad o municipio" },
  { value: "regional",      label: "Regional",       desc: "Varias ciudades / región" },
  { value: "nacional",      label: "Nacional",       desc: "Cobertura todo el país" },
  { value: "latam",         label: "Latam",          desc: "Varios países de la región" },
  { value: "internacional", label: "Internacional",  desc: "Presencia global" },
];

// ─── SCREENING DATA ───────────────────────────────────────────────────────────
const BLOCKS = [
  {
    id: "contexto", name: "Contexto y Complejidad", weight: 20,
    color: "#C8A96E", icon: "◈",
    description: "Madurez organizacional, escala y estructura de liderazgo",
    questions: [
      { id: "q01", text: "¿Cuántos años lleva la empresa operando?",                                           scales: ["<2 años","2–4 años","5–8 años","9–15 años",">15 años con evolución estructural"] },
      { id: "q02", text: "¿Facturación anual aproximada?",                                                     scales: ["<$1.000M","$1.000–5.000M","$5.000–15.000M","$15.000–40.000M",">$40.000M"] },
      { id: "q03", text: "¿Número de personas en el equipo comercial?",                                        scales: ["1–2","3–5","6–10","11–20",">20"] },
      { id: "q04", text: "¿Cuántas líneas de negocio activas?",                                                scales: ["1","2","3","4","5+"] },
      { id: "q05", text: "¿Cuántos segmentos de cliente atienden?",                                            scales: ["1","2","3","4","5+"] },
      { id: "q06", text: "¿El fundador sigue involucrado directamente en decisiones comerciales?",             scales: ["100% dependiente","Alta dependencia","Dependencia parcial","Decisión compartida","Estructura autónoma"] },
    ],
  },
  {
    id: "sistema", name: "Sistema Comercial", weight: 25,
    color: "#4A90C4", icon: "◎",
    description: "Estructura, predictibilidad y disciplina del motor de ventas",
    questions: [
      { id: "q07", text: "¿Tienen pipeline formal con etapas definidas?",                                      scales: ["No existe","Informal","Parcial","Definido, inconsistente","Formal y disciplinado"] },
      { id: "q08", text: "¿La proyección comercial es predecible?",                                            scales: ["Impredecible","Muy variable","Moderada","Bastante","Altamente"] },
      { id: "q09", text: "¿Cómo se definen metas?",                                                           scales: ["Reactivo","Anual general","Por área","Por etapa","Conectadas a margen/estructura"] },
      { id: "q10", text: "¿Cómo se mide desempeño?",                                                          scales: ["Solo ventas","Básico","KPIs mensuales","KPIs por etapa","KPIs accionables y consistentes"] },
      { id: "q11", text: "¿Qué porcentaje de ventas depende de 1–2 personas?",                                scales: [">70%","50–70%","30–50%","15–30%","<15%"] },
      { id: "q12", text: "¿Hay disciplina semanal comercial formal?",                                          scales: ["No existe","Esporádica","Mensual","Semanal irregular","Semanal estructurada"] },
    ],
  },
  {
    id: "margen", name: "Margen y Criterio", weight: 20,
    color: "#6B8FD4", icon: "◉",
    description: "Claridad sobre rentabilidad real y decisiones basadas en margen",
    questions: [
      { id: "q13", text: "¿Cómo definen precios y descuentos?",                                                scales: ["Improvisado","Competencia","Mercado","Margen","Estrategia + rentabilidad"] },
      { id: "q14", text: "¿Conocen el margen real por línea?",                                                 scales: ["No","Estimado","Parcial","Formal","Por línea y cliente"] },
      { id: "q15", text: "¿Existen excepciones frecuentes en negociación?",                                    scales: ["Constantes","Muy frecuentes","Moderadas","Pocas","Excepcionales"] },
      { id: "q16", text: "¿Quién aprueba descuentos?",                                                         scales: ["Vendedor","Sin política","Aprobación básica","Aprobación estructurada","Política estricta + monitoreo"] },
      { id: "q17", text: "¿Qué tan clara es la rentabilidad por cliente?",                                     scales: ["No se mide","Estimación","Parcial","Formal","Usada en decisiones"] },
      { id: "q18", text: "¿Toman decisiones comerciales con información financiera actualizada?",               scales: ["No se usa","Ocasional","Parcial","Frecuente","Sistemática y actualizada"] },
    ],
  },
  {
    id: "incentivos", name: "Incentivos y Alineación", weight: 20,
    color: "#D4896A", icon: "◐",
    description: "Coherencia entre compensación, objetivos individuales y corporativos",
    questions: [
      { id: "q19", text: "¿El esquema de comisiones está alineado con rentabilidad?",                          scales: ["Solo volumen","Mayormente volumen","Mixto sin claridad","Mayormente margen","Totalmente a rentabilidad"] },
      { id: "q20", text: "¿Hay conflicto entre vender volumen y vender margen?",                               scales: ["Alto","Frecuente","Moderado","Bajo","Coherencia total"] },
      { id: "q21", text: "¿Cómo se gestionan los objetivos individuales vs corporativos?",                     scales: ["Desalineados","Parcial desalineación","Neutral","Alineados","Integrados"] },
      { id: "q22", text: "¿Existen incentivos cruzados que generen fricción?",                                 scales: ["Fricción grave","Moderada","Leve","Ajustes menores","Coherente"] },
      { id: "q23", text: "¿Qué tan claro es el accountability?",                                               scales: ["Difuso","Poco claro","Moderado","Claro","Formal y exigente"] },
      { id: "q24", text: "¿Hay evaluación formal del desempeño comercial?",                                    scales: ["No existe","Esporádica","Anual","Trimestral","Periódica estructurada"] },
    ],
  },
  {
    id: "tension", name: "Tensión Estratégica", weight: 15,
    color: "#5BA3CC", icon: "◑",
    description: "Consciencia del riesgo, apertura al cambio y urgencia ejecutiva",
    questions: [
      { id: "q25", text: "¿Cuál es hoy el mayor riesgo comercial?",                                            scales: ["No claro","Intuitivo","Parcial","Claro","Cuantificado/monitoreado"] },
      { id: "q26", text: "¿Dónde sienten pérdida de control?",                                                 scales: ["Alta","Significativa","Moderada","Baja","Control estructural"] },
      { id: "q27", text: "¿Qué fricción interna es recurrente?",                                               scales: ["Grave/constante","Frecuente","Ocasional","Puntual","Mínima"] },
      { id: "q28", text: "¿Qué cambiarían si pudieran rediseñar el sistema?",                                  scales: ["No saben","Resistencia alta","Algunas ideas","Prioridades claras","Visión estructural clara"] },
      { id: "q29", text: "¿Qué ha intentado ya que no funcionó?",                                              scales: ["Múltiples fallidos","Varios sin resultado","Algunos ajustes","Pocos intentos","Ajustes exitosos"] },
      { id: "q30", text: "¿Qué pasaría si no hacen nada en 12 meses?",                                        scales: ["No estiman","Bajo percibido","Moderado","Alto","Crítico"] },
    ],
  },
];

const ALL_QUESTIONS = BLOCKS.flatMap(b => b.questions.map(q => ({ ...q, blockId: b.id })));

// ─── SCORING ─────────────────────────────────────────────────────────────────
function computeScores(answers) {
  const blockScores = {};
  BLOCKS.forEach(b => {
    const answered = b.questions.filter(q => answers[q.id] != null);
    blockScores[b.id] = answered.length
      ? +( answered.reduce((s, q) => s + answers[q.id], 0) / answered.length ).toFixed(4)
      : null;
  });
  const done = BLOCKS.filter(b => blockScores[b.id] != null);
  if (!done.length) return { blockScores, total: null, total100: null };
  let w = 0, tw = 0;
  done.forEach(b => { w += blockScores[b.id] * b.weight; tw += b.weight; });
  const total = +(w / tw).toFixed(4);
  return { blockScores, total, total100: Math.round(total * 20) };
}

function getInterp(s) {
  if (s === null) return null;
  if (s >= 84) return { label: "Sistema maduro",            sub: "Alta complejidad — ideal para transformación profunda", color: "#4A90C4" };
  if (s >= 70) return { label: "Listo (complejidad media)", sub: "Oportunidad de transformación clara y bien delimitada", color: "#C8A96E" };
  if (s >= 56) return { label: "En desarrollo",             sub: "Necesita acompañamiento gradual y estructurado",        color: "#D4896A" };
  return              { label: "Etapa temprana",            sub: "Se recomienda diagnóstico exploratorio previo",         color: "#5BA3CC" };
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#09090B;--bg2:#111116;--bg3:#18181F;--bg4:#1E1E28;
  --b:rgba(255,255,255,0.06);--b2:rgba(255,255,255,0.10);
  --gold:#C8A96E;--gold2:#DFC08A;
  --blue:#4A90C4;--blue2:#6AAEE0;--blue3:#2D6A9F;
  --indigo:#6B8FD4;--orange:#D4896A;--sky:#5BA3CC;
  --text:#EEEAE4;--mt:#6B6965;--mt2:#9A9692;
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}

/* NAV */
.nav{display:flex;align-items:center;justify-content:space-between;padding:18px 48px;border-bottom:1px solid var(--b);position:sticky;top:0;background:rgba(9,9,11,0.96);backdrop-filter:blur(16px);z-index:100}
.nav-brand{display:flex;align-items:center;gap:14px}
.nav-wm{font-family:'Playfair Display',serif;font-size:17px;letter-spacing:.12em;color:var(--gold);font-weight:600}
.nav-div{width:1px;height:20px;background:var(--b2)}
.nav-tl{font-size:11px;color:var(--mt);letter-spacing:.15em;text-transform:uppercase}
.pill{background:rgba(74,144,196,.10);border:1px solid rgba(74,144,196,.25);color:var(--blue2);padding:5px 14px;border-radius:20px;font-size:12px}
.pill-g{background:rgba(200,169,110,.10);border:1px solid rgba(200,169,110,.25);color:var(--gold)}

/* HERO */
.hero{padding:88px 48px 56px;max-width:880px;margin:0 auto;text-align:center}
.eyebrow{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:var(--blue);margin-bottom:20px;display:flex;align-items:center;justify-content:center;gap:10px}
.eyebrow::before,.eyebrow::after{content:'';width:32px;height:1px;background:var(--blue3)}
.hero h1{font-family:'Playfair Display',serif;font-size:clamp(34px,5vw,58px);font-weight:700;line-height:1.1;margin-bottom:22px}
.hero h1 em{font-style:normal;color:var(--gold)}
.hero p{color:var(--mt2);font-size:16px;line-height:1.75;max-width:560px;margin:0 auto 48px}
.hblocks{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;padding:0 24px 72px}
.hbi{text-align:center}
.hbi-icon{font-size:26px;margin-bottom:8px;opacity:.8}
.hbi-name{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase}
.hbi-w{font-size:10px;color:var(--mt);margin-top:3px}

/* FORM */
.fw{background:var(--bg2);border:1px solid var(--b2);border-radius:18px;padding:36px 40px;max-width:680px;margin:0 auto 56px}
.fw-title{font-family:'Playfair Display',serif;font-size:18px;margin-bottom:6px}
.fw-sub{font-size:13px;color:var(--mt2);margin-bottom:28px}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px}
.fr.s{grid-template-columns:1fr}
.fg label{display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--mt);margin-bottom:7px;font-weight:600}
.fg input,.fg select{width:100%;background:var(--bg3);border:1px solid var(--b2);color:var(--text);padding:11px 14px;border-radius:9px;font-size:13px;font-family:inherit;outline:none;transition:border-color .2s,background .2s;appearance:none;-webkit-appearance:none}
.fg select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6965' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px}
.fg input:focus,.fg select:focus{border-color:rgba(74,144,196,.45);background:var(--bg4)}
.fg select option{background:#18181F}
.fg select:disabled{opacity:.4;cursor:not-allowed}

/* SCOPE */
.scope-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.so{padding:10px 6px;border:1px solid var(--b2);border-radius:9px;cursor:pointer;text-align:center;transition:all .2s;background:var(--bg3)}
.so:hover{border-color:rgba(74,144,196,.4)}
.so.sel{border-color:var(--blue);background:rgba(74,144,196,.08)}
.so-l{font-size:12px;font-weight:600;display:block;color:var(--text)}
.so.sel .so-l{color:var(--blue2)}
.so-d{font-size:10px;color:var(--mt);margin-top:3px;display:block;line-height:1.3}

/* BUTTONS */
.bp{background:var(--gold);color:#09090B;border:none;padding:14px 36px;border-radius:9px;font-size:13px;font-weight:600;letter-spacing:.08em;cursor:pointer;transition:all .2s;font-family:inherit}
.bp:hover{background:var(--gold2);transform:translateY(-1px);box-shadow:0 8px 24px rgba(200,169,110,.2)}
.bp:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none}
.bg-btn{background:transparent;border:1px solid var(--b2);color:var(--mt2);padding:12px 28px;border-radius:9px;font-size:13px;cursor:pointer;font-family:inherit;transition:all .2s}
.bg-btn:hover:not(:disabled){border-color:var(--blue);color:var(--blue2)}
.bg-btn:disabled{opacity:.3;cursor:not-allowed}
.bctr{display:flex;justify-content:center;margin-top:8px}

/* SAVE STATUS */
.save-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:4px 12px;border-radius:12px;letter-spacing:.06em}
.save-ok{background:rgba(74,144,196,.12);color:var(--blue2);border:1px solid rgba(74,144,196,.25)}
.save-err{background:rgba(212,137,106,.12);color:var(--orange);border:1px solid rgba(212,137,106,.25)}
.save-ing{background:rgba(255,255,255,.05);color:var(--mt2);border:1px solid var(--b)}

/* PROGRESS */
.pw{padding:0 48px}
.pbar{background:var(--bg3);border-radius:3px;height:2px;overflow:hidden}
.pfill{height:100%;background:linear-gradient(90deg,var(--blue3),var(--blue2),var(--gold));transition:width .6s cubic-bezier(.4,0,.2,1);border-radius:3px}
.plabel{display:flex;justify-content:space-between;margin-bottom:8px}
.plabel span{font-size:11px;color:var(--mt)}

/* BLOCK NAV */
.bnav{display:flex;gap:6px;padding:20px 48px 0;overflow-x:auto;scrollbar-width:none}
.bnav::-webkit-scrollbar{display:none}
.bc-chip{padding:7px 14px;border-radius:20px;font-size:11px;border:1px solid var(--b);cursor:pointer;white-space:nowrap;transition:all .2s;color:var(--mt);display:flex;align-items:center;gap:6px;letter-spacing:.04em}
.bc-chip:hover{border-color:var(--b2);color:var(--mt2)}
.bc-chip.active{border-color:var(--gold);color:var(--gold);background:rgba(200,169,110,.07)}
.bc-chip.done{border-color:rgba(74,144,196,.4);color:var(--blue2);background:rgba(74,144,196,.06)}
.bcd{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}

/* QUESTION PANEL */
.qp{max-width:720px;margin:0 auto;padding:28px 48px 80px}
.qmeta{display:flex;gap:10px;align-items:center;margin-bottom:20px}
.qbadge{font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:5px 12px;border-radius:12px;border:1px solid;font-weight:600}
.qctr{font-size:12px;color:var(--mt)}
.qtxt{font-family:'Playfair Display',serif;font-size:clamp(22px,3.5vw,30px);font-weight:600;line-height:1.25;margin-bottom:6px}
.qdesc{font-size:13px;color:var(--mt);font-style:italic;margin-bottom:32px}
.slist{display:flex;flex-direction:column;gap:9px}
.sopt{display:flex;align-items:center;gap:16px;padding:14px 18px;background:var(--bg2);border:1.5px solid var(--b);border-radius:11px;cursor:pointer;transition:all .18s}
.sopt:hover{border-color:rgba(74,144,196,.35);background:var(--bg3)}
.sopt.sel{border-color:var(--blue);background:rgba(74,144,196,.07)}
.snum{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;background:var(--bg3);border:1px solid var(--b2);flex-shrink:0;transition:all .18s;color:var(--mt)}
.sopt.sel .snum{background:var(--blue);border-color:var(--blue);color:#fff}
.stxt{font-size:14px;color:var(--mt2);transition:color .18s}
.sopt.sel .stxt{color:var(--text);font-weight:500}
.nbox{background:var(--bg2);border:1px solid var(--b);border-radius:10px;padding:14px 16px;margin-top:18px}
.nbox label{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--mt);display:block;margin-bottom:7px}
.nbox textarea{width:100%;background:transparent;border:none;color:var(--mt2);font-size:13px;font-family:inherit;resize:none;outline:none;line-height:1.6}
.qnav{display:flex;justify-content:space-between;align-items:center;margin-top:28px;padding-top:24px;border-top:1px solid var(--b)}
.dots-nav{display:flex;gap:5px}
.dn{width:6px;height:6px;border-radius:50%;background:var(--b2);transition:all .25s}
.dn.a{background:var(--gold);transform:scale(1.4)}
.dn.d{background:var(--blue)}

/* RESULTS */
.rw{max-width:920px;margin:0 auto;padding:48px 48px 80px}
.rhdr{text-align:center;margin-bottom:60px}
.ring-w{width:164px;height:164px;margin:0 auto 20px;position:relative}
.ring-w svg{transform:rotate(-90deg)}
.ring-inner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}
.snum-big{font-family:'Playfair Display',serif;font-size:50px;font-weight:700;color:var(--gold);line-height:1}
.sdenom{font-size:12px;color:var(--mt);letter-spacing:.1em;text-transform:uppercase}
.ipill{display:inline-flex;align-items:center;gap:8px;padding:7px 20px;border-radius:20px;font-size:13px;font-weight:500;margin-bottom:8px}
.clabel{font-size:13px;color:var(--mt);margin-top:10px}
.cc{background:var(--bg2);border:1px solid var(--b);border-radius:16px;padding:32px;margin-bottom:28px}
.cc-t{font-family:'Playfair Display',serif;font-size:20px;margin-bottom:5px}
.cc-s{font-size:13px;color:var(--mt);margin-bottom:28px}
.bgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
@media(max-width:680px){.bgrid{grid-template-columns:1fr}}
.bcard{background:var(--bg2);border:1px solid var(--b);border-radius:14px;padding:22px}
.bc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.bc-nm{font-size:12px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;margin-bottom:4px}
.bc-sv{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;line-height:1}
.bc-sv sub{font-size:14px;opacity:.45;font-family:'DM Sans',sans-serif}
.bc-ico{font-size:22px;opacity:.6}
.bcbar{background:var(--bg4);border-radius:3px;height:3px;margin-bottom:10px;overflow:hidden}
.bcfill{height:100%;border-radius:3px;transition:width 1.2s cubic-bezier(.4,0,.2,1)}
.bc-dsc{font-size:12px;color:var(--mt);line-height:1.55}

/* AI */
.aip{background:linear-gradient(140deg,rgba(74,144,196,.06) 0%,rgba(200,169,110,.05) 100%);border:1px solid rgba(74,144,196,.18);border-radius:16px;padding:36px;margin-bottom:28px}
.ai-hd{display:flex;align-items:center;gap:14px;margin-bottom:24px}
.ai-badge{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--blue2);background:rgba(74,144,196,.12);border:1px solid rgba(74,144,196,.25);padding:4px 12px;border-radius:12px;font-weight:600}
.ai-hd h3{font-family:'Playfair Display',serif;font-size:21px}
.ai-load{display:flex;align-items:center;gap:14px;color:var(--mt2);font-size:14px}
.blink span{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--blue2);margin:0 2px;animation:blk 1.4s ease-in-out infinite}
.blink span:nth-child(2){animation-delay:.2s}.blink span:nth-child(3){animation-delay:.4s}
@keyframes blk{0%,80%,100%{opacity:.15;transform:scale(.75)}40%{opacity:1;transform:scale(1)}}
.ai-body p{font-size:14px;line-height:1.85;color:rgba(238,234,228,.82);margin-bottom:10px}
.ai-body p.h{font-size:12px;font-weight:600;color:var(--blue2);letter-spacing:.1em;text-transform:uppercase;margin-top:18px;margin-bottom:4px}

/* CTA */
.ctar{display:flex;gap:14px;justify-content:center;margin-top:32px;flex-wrap:wrap}

/* PROPOSAL */
.propw{max-width:860px;margin:0 auto;padding:40px 48px 80px}
.prop-hero{background:var(--bg2);border:1px solid var(--b2);border-radius:20px;padding:48px;margin-bottom:24px;position:relative;overflow:hidden}
.prop-hero::after{content:'';position:absolute;top:-60px;right:-60px;width:260px;height:260px;background:radial-gradient(circle,rgba(74,144,196,.10),transparent 70%);border-radius:50%;pointer-events:none}
.ph-eye{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--blue2);margin-bottom:14px}
.prop-hero h1{font-family:'Playfair Display',serif;font-size:clamp(26px,4vw,38px);font-weight:700;line-height:1.18;margin-bottom:14px}
.prop-hero p{color:var(--mt2);font-size:14px;line-height:1.7;max-width:520px}
.ph-tags{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
.ptag{background:var(--bg3);border:1px solid var(--b);padding:7px 14px;border-radius:8px;font-size:12px;color:var(--mt2)}
.ptag b{color:var(--text);font-weight:500}
.psec{background:var(--bg2);border:1px solid var(--b);border-radius:14px;padding:30px;margin-bottom:18px}
.psec h3{font-family:'Playfair Display',serif;font-size:19px;margin-bottom:5px}
.ps-sub{font-size:13px;color:var(--mt);margin-bottom:22px}
.tl{display:flex;flex-direction:column;gap:14px}
.tl-i{display:flex;gap:18px;align-items:flex-start}
.tl-d{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--gold);flex-shrink:0;font-weight:700}
.tl-b h4{font-size:13px;font-weight:600;margin-bottom:3px}
.tl-b p{font-size:12px;color:var(--mt);line-height:1.55}

/* NEXT STEPS — sin precio */
.next-steps-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:8px}
.ns-card{background:var(--bg3);border:1px solid var(--b2);border-radius:12px;padding:20px}
.ns-num{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:var(--gold);margin-bottom:8px}
.ns-title{font-size:13px;font-weight:600;margin-bottom:6px}
.ns-desc{font-size:12px;color:var(--mt);line-height:1.55}

/* CTA AGENDA */
.agenda-box{background:linear-gradient(135deg,rgba(74,144,196,.08),rgba(200,169,110,.05));border:1px solid rgba(74,144,196,.2);border-radius:16px;padding:36px;margin-bottom:18px;text-align:center}
.ag-title{font-family:'Playfair Display',serif;font-size:22px;margin-bottom:8px}
.ag-sub{font-size:14px;color:var(--mt2);max-width:480px;margin:0 auto 24px}
.ag-note{font-size:12px;color:var(--mt);margin-top:16px;font-style:italic}

.pfoot{text-align:center;margin-top:56px;padding-top:32px;border-top:1px solid var(--b)}
.pf-logo{font-family:'Playfair Display',serif;font-size:17px;color:var(--gold);margin-bottom:6px;letter-spacing:.1em}
.pf-tag{font-size:11px;color:var(--mt);letter-spacing:.18em;text-transform:uppercase}
.pf-url{font-size:12px;color:var(--mt);margin-top:6px}

@keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fu .45s ease forwards}

@media(max-width:640px){
  .nav{padding:14px 18px}
  .nav-div,.nav-tl{display:none}
  .hero{padding:52px 20px 40px}
  .fw{padding:24px 20px}
  .fr{grid-template-columns:1fr}
  .scope-grid{grid-template-columns:1fr 1fr}
  .bnav{padding:14px 18px 0}
  .qp{padding:20px 18px 60px}
  .rw{padding:28px 18px 60px}
  .propw{padding:24px 18px 60px}
  .prop-hero{padding:28px 20px}
  .pw{padding:0 18px}
  .next-steps-grid{grid-template-columns:1fr}
}
`;

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [phase, setPhase]       = useState("intro");
  const [company, setCompany]   = useState({ name:"", industry:"", subIndustry:"", scope:"", contact:"" });
  const [answers, setAnswers]   = useState({});
  const [notes, setNotes]       = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [aiRec, setAiRec]       = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "ok" | "err"
  const [screeningId, setScreeningId] = useState(null);
  const topRef = useRef();

  const scores = computeScores(answers);
  const interp = getInterp(scores.total100);
  const subOptions = company.industry ? (INDUSTRIES[company.industry] || []) : [];
  const canStart = company.name.trim() && company.industry && company.subIndustry && company.scope;
  const scopeObj = OPERATION_SCOPES.find(s => s.value === company.scope);

  function go(ph) {
    setPhase(ph);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function selectAnswer(score) {
    setAnswers(p => ({ ...p, [ALL_QUESTIONS[currentQ].id]: score }));
  }

  function nextQ() {
    if (currentQ < ALL_QUESTIONS.length - 1) { setCurrentQ(c => c + 1); go("screening"); }
    else finishScreening();
  }
  function prevQ() { if (currentQ > 0) setCurrentQ(c => c - 1); }

  async function finishScreening() {
    go("results");
    const sc = computeScores(answers);
    await Promise.all([fetchAI(sc), persistScreening(sc)]);
  }

  // ── PERSISTENCIA SUPABASE ──────────────────────────────────────────────────
  async function persistScreening(sc) {
    setSaveStatus("saving");

    // Construimos objeto plano con cada respuesta individual + label
    const answerFlat = {};
    ALL_QUESTIONS.forEach(q => {
      const val = answers[q.id];
      answerFlat[`${q.id}_score`] = val ?? null;
      answerFlat[`${q.id}_label`] = val != null ? q.scales[val - 1] : null;
      answerFlat[`${q.id}_note`]  = notes[q.id] || null;
    });

    const payload = {
      // ── Identificación ──
      company_name:      company.name,
      contact_name:      company.contact || null,
      industry:          company.industry,
      sub_industry:      company.subIndustry,
      operation_scope:   company.scope,
      // ── Scores globales ──
      score_total_100:   sc.total100,
      score_total_5:     sc.total,
      interpretation:    getInterp(sc.total100)?.label || null,
      // ── Scores por bloque ──
      score_contexto:    sc.blockScores.contexto,
      score_sistema:     sc.blockScores.sistema,
      score_margen:      sc.blockScores.margen,
      score_incentivos:  sc.blockScores.incentivos,
      score_tension:     sc.blockScores.tension,
      // ── Respuestas individuales (columnas planas) ──
      ...answerFlat,
      // ── Metadata ──
      completed_at: new Date().toISOString(),
    };

    const saved = await saveScreening(payload);
    if (saved) {
      setSaveStatus("ok");
      setScreeningId(saved.id);
    } else {
      setSaveStatus("err");
    }
  }

  // ── IA ──────────────────────────────────────────────────────────────────────
  async function fetchAI(sc) {
    setAiLoading(true);
    const scopeLabel = scopeObj?.label || company.scope;
    const blockSummary = BLOCKS.map(b => {
      const bs = sc.blockScores[b.id];
      const criticals = b.questions
        .filter(q => answers[q.id] != null && answers[q.id] <= 2)
        .map(q => `"${q.text}" (${answers[q.id]}/5)`)
        .slice(0, 2).join("; ");
      return `  • ${b.name} (peso ${b.weight}%): ${bs ? bs.toFixed(2) + "/5" : "N/A"}${criticals ? " — crítico: " + criticals : ""}`;
    }).join("\n");

    const prompt = `Eres el Director de Metodología de Sightline Advisory, firma colombiana especializada en arquitectura y transformación de sistemas comerciales.

PERFIL EMPRESA:
- Nombre: ${company.name}
- Sector: ${company.industry} › ${company.subIndustry}
- Alcance operativo: ${scopeLabel}
- Score global: ${sc.total100}/100 — ${getInterp(sc.total100)?.label}

SCORES POR DIMENSIÓN:
${blockSummary}

Genera un análisis ejecutivo en español, altamente personalizado. Demuestra comprensión del sector "${company.subIndustry}" y de las dinámicas comerciales típicas de empresas con operación ${scopeLabel.toLowerCase()}.

Usa EXACTAMENTE estos encabezados (en mayúsculas, sin asteriscos ni markdown):

DIAGNÓSTICO SITUACIONAL
2-3 párrafos sobre la realidad comercial, integrando sector, escala operativa y patrones del screening. Menciona retos específicos del sector ${company.subIndustry}.

HALLAZGOS CRÍTICOS
Los 3 hallazgos más urgentes según los bloques con menor score. Señala implicaciones concretas para el negocio.

PALANCAS DE TRANSFORMACIÓN
Las 3 intervenciones de mayor impacto para este perfil, en orden de prioridad. Conecta cada una con el contexto del sector y el alcance ${scopeLabel.toLowerCase()}.

RECOMENDACIÓN SIGHTLINE
Conclusión ejecutiva directa sobre si esta empresa debe iniciar el Diagnóstico Comercial Intensivo. Si score es bajo, justifica la urgencia; si es alto, explica la oportunidad de escalar.

Tono: ejecutivo, directo, sin rodeos. Sin asteriscos ni markdown. Máximo 400 palabras.`;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setAiRec(data.content?.map(c => c.text || "").join("") || "");
    } catch {
      setAiRec("No se pudo conectar con el motor IA. Revise los scores por bloque para el diagnóstico.");
    }
    setAiLoading(false);
  }

  const q = ALL_QUESTIONS[currentQ];
  const curBlock = BLOCKS.find(b => b.id === q?.blockId);
  const progress = ((currentQ + (answers[q?.id] != null ? 1 : 0)) / ALL_QUESTIONS.length) * 100;
  const bprog = BLOCKS.map(b => ({
    ...b,
    done: b.questions.filter(bq => answers[bq.id] != null).length,
    complete: b.questions.every(bq => answers[bq.id] != null),
  }));

  return (
    <>
      <style>{CSS}</style>
      <div className="app" ref={topRef}>

        {/* ─── NAV ─── */}
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-wm">SIGHTLINE</div>
            <div className="nav-div" />
            <div className="nav-tl">Estrategia en Ejecución</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {phase === "screening" && <span className="pill">{currentQ + 1} / {ALL_QUESTIONS.length}</span>}
            {phase === "results" && scores.total100 != null && <span className="pill pill-g">Score {scores.total100}/100</span>}
            {phase === "results" && saveStatus === "saving" && <span className="save-badge save-ing">⏳ Guardando...</span>}
            {phase === "results" && saveStatus === "ok"      && <span className="save-badge save-ok">✓ Guardado</span>}
            {phase === "results" && saveStatus === "err"     && <span className="save-badge save-err">⚠ Sin BD</span>}
          </div>
        </nav>

        {/* ════ INTRO ════ */}
        {phase === "intro" && (
          <div className="fu">
            <div className="hero">
              <div className="eyebrow">Screening Comercial Ejecutivo</div>
              <h1>¿Qué tan <em>sólido</em> es<br />tu sistema comercial?</h1>
              <p>30 preguntas. 5 dimensiones. Una radiografía honesta de la arquitectura comercial de tu empresa — con hallazgos por bloque, perfil de madurez y ruta de acción personalizada.</p>
            </div>

            <div className="fw">
              <div className="fw-title">Cuéntanos sobre tu empresa</div>
              <div className="fw-sub">Esta información permite personalizar el análisis a tu sector, sub-industria y alcance operativo.</div>

              <div className="fr">
                <div className="fg">
                  <label>Nombre de la empresa *</label>
                  <input placeholder="Ej. Grupo Andino S.A.S." value={company.name}
                    onChange={e => setCompany(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="fg">
                  <label>Contacto / Evaluador</label>
                  <input placeholder="Nombre completo" value={company.contact}
                    onChange={e => setCompany(p => ({ ...p, contact: e.target.value }))} />
                </div>
              </div>

              <div className="fr">
                <div className="fg">
                  <label>Industria *</label>
                  <select value={company.industry} onChange={e => setCompany(p => ({ ...p, industry: e.target.value, subIndustry: "" }))}>
                    <option value="">Seleccionar industria...</option>
                    {Object.keys(INDUSTRIES).map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label>Sub-industria / Segmento *</label>
                  <select value={company.subIndustry} onChange={e => setCompany(p => ({ ...p, subIndustry: e.target.value }))} disabled={!company.industry}>
                    <option value="">{company.industry ? "Seleccionar segmento..." : "Primero elige industria"}</option>
                    {subOptions.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="fg" style={{ marginBottom: 24 }}>
                <label>Alcance operativo *</label>
                <div className="scope-grid">
                  {OPERATION_SCOPES.map(s => (
                    <div key={s.value} className={`so ${company.scope === s.value ? "sel" : ""}`}
                      onClick={() => setCompany(p => ({ ...p, scope: s.value }))}>
                      <span className="so-l">{s.label}</span>
                      <span className="so-d">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bctr">
                <button className="bp" onClick={() => go("screening")} disabled={!canStart}>
                  Iniciar Screening →
                </button>
              </div>
            </div>

            <div className="hblocks">
              {BLOCKS.map(b => (
                <div key={b.id} className="hbi">
                  <div className="hbi-icon">{b.icon}</div>
                  <div className="hbi-name" style={{ color: b.color }}>{b.name}</div>
                  <div className="hbi-w">Peso: {b.weight}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ SCREENING ════ */}
        {phase === "screening" && q && (
          <div className="fu">
            <div className="bnav">
              {bprog.map(b => (
                <div key={b.id}
                  className={`bc-chip ${b.id === q.blockId ? "active" : ""} ${b.complete ? "done" : ""}`}
                  onClick={() => { const i = ALL_QUESTIONS.findIndex(aq => aq.blockId === b.id); setCurrentQ(i); }}>
                  <span className="bcd" />
                  {b.name}
                  <span style={{ opacity: .55 }}>({b.done}/{b.questions.length})</span>
                </div>
              ))}
            </div>

            <div className="pw" style={{ marginTop: 16 }}>
              <div className="plabel">
                <span>{curBlock?.name}</span>
                <span>{Math.round(progress)}% completado</span>
              </div>
              <div className="pbar"><div className="pfill" style={{ width: `${progress}%` }} /></div>
            </div>

            <div className="qp">
              <div className="qmeta">
                <div className="qbadge" style={{ color: curBlock.color, borderColor: `${curBlock.color}35`, background: `${curBlock.color}0D` }}>
                  {curBlock.icon} {curBlock.name}
                </div>
                <div className="qctr">Pregunta {currentQ + 1} de {ALL_QUESTIONS.length}</div>
              </div>
              <div className="qtxt">{q.text}</div>
              <div className="qdesc">{curBlock.description}</div>

              <div className="slist">
                {q.scales.map((label, idx) => {
                  const score = idx + 1, sel = answers[q.id] === score;
                  return (
                    <div key={idx} className={`sopt ${sel ? "sel" : ""}`} onClick={() => selectAnswer(score)}>
                      <div className="snum">{score}</div>
                      <div className="stxt">{label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="nbox">
                <label>Notas / Evidencia (opcional)</label>
                <textarea rows={2} placeholder="Observaciones del evaluador..." value={notes[q.id] || ""}
                  onChange={e => setNotes(p => ({ ...p, [q.id]: e.target.value }))} />
              </div>

              <div className="qnav">
                <button className="bg-btn" onClick={prevQ} disabled={currentQ === 0}>← Anterior</button>
                <div className="dots-nav">
                  {[-2, -1, 0, 1, 2].map(o => {
                    const i = currentQ + o;
                    if (i < 0 || i >= ALL_QUESTIONS.length) return <div key={o} style={{ width: 6 }} />;
                    return <div key={o} className={`dn ${i === currentQ ? "a" : answers[ALL_QUESTIONS[i].id] != null ? "d" : ""}`} />;
                  })}
                </div>
                <button className="bp" onClick={nextQ} disabled={answers[q.id] == null}>
                  {currentQ === ALL_QUESTIONS.length - 1 ? "Ver Resultados →" : "Siguiente →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ RESULTS ════ */}
        {phase === "results" && (
          <div className="fu">
            <div className="rw">
              <div className="rhdr">
                <div className="ring-w">
                  <svg viewBox="0 0 164 164" width="164" height="164">
                    <defs>
                      <linearGradient id="rg" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4A90C4" />
                        <stop offset="100%" stopColor="#C8A96E" />
                      </linearGradient>
                    </defs>
                    <circle cx="82" cy="82" r="68" fill="none" stroke="var(--bg3)" strokeWidth="10" />
                    <circle cx="82" cy="82" r="68" fill="none" stroke="url(#rg)" strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 68}`}
                      strokeDashoffset={`${2 * Math.PI * 68 * (1 - (scores.total100 || 0) / 100)}`}
                      style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)" }} />
                  </svg>
                  <div className="ring-inner">
                    <div className="snum-big">{scores.total100 ?? "–"}</div>
                    <div className="sdenom">/ 100</div>
                  </div>
                </div>
                {interp && (
                  <div className="ipill" style={{ background: `${interp.color}18`, color: interp.color, border: `1px solid ${interp.color}38` }}>
                    {interp.label}
                  </div>
                )}
                <p style={{ fontSize: 14, color: "var(--mt2)", maxWidth: 420, margin: "8px auto 0" }}>{interp?.sub}</p>
                <div className="clabel">{company.name} · {company.subIndustry} · {scopeObj?.label}</div>
              </div>

              {/* Radar */}
              <div className="cc">
                <div className="cc-t">Perfil de Madurez Comercial</div>
                <div className="cc-s">Análisis multidimensional — escala 1 a 5</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={BLOCKS.map(b => ({
                    subject: b.name.split(" ").slice(0, 2).join(" "),
                    score: scores.blockScores[b.id] || 0, fullMark: 5,
                  }))}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B6965", fontSize: 12, fontFamily: "DM Sans" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar dataKey="score" stroke="#4A90C4" fill="#4A90C4" fillOpacity={0.12} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Block cards */}
              <div className="bgrid">
                {BLOCKS.map(b => {
                  const s = scores.blockScores[b.id];
                  return (
                    <div className="bcard" key={b.id}>
                      <div className="bc-top">
                        <div>
                          <div className="bc-nm" style={{ color: b.color }}>{b.name}</div>
                          <div className="bc-sv" style={{ color: b.color }}>{s ? s.toFixed(2) : "–"}<sub>/5</sub></div>
                        </div>
                        <div className="bc-ico">{b.icon}</div>
                      </div>
                      <div className="bcbar">
                        <div className="bcfill" style={{ width: `${s ? (s / 5) * 100 : 0}%`, background: b.color }} />
                      </div>
                      <div className="bc-dsc">{b.description}</div>
                    </div>
                  );
                })}
              </div>

              {/* Análisis de resultados */}
              <div className="aip">
                <div className="ai-hd">
                  <div className="ai-badge">✦ Sightline Insights</div>
                  <h3>Análisis de resultados — {company.name}</h3>
                </div>
                {aiLoading ? (
                  <div className="ai-load">
                    <div className="blink"><span /><span /><span /></div>
                    Procesando perfil {company.subIndustry} · operación {scopeObj?.label?.toLowerCase()}...
                  </div>
                ) : aiRec ? (
                  <div className="ai-body">
                    {aiRec.split("\n").filter(l => l.trim()).map((line, i) => {
                      const clean = line.replace(/\*\*/g, "").trim();
                      const isH = ["DIAGNÓSTICO SITUACIONAL", "HALLAZGOS CRÍTICOS", "PALANCAS DE TRANSFORMACIÓN", "RECOMENDACIÓN SIGHTLINE"].some(h => clean.startsWith(h));
                      return <p key={i} className={isH ? "h" : ""}>{clean}</p>;
                    })}
                  </div>
                ) : null}
              </div>

              <div className="ctar">
                <button className="bp" onClick={() => go("proposal")}>Ver Ruta de Acción →</button>
                <button className="bg-btn" onClick={() => { setCurrentQ(0); go("screening"); }}>Revisar Respuestas</button>
              </div>
            </div>
          </div>
        )}

        {/* ════ PROPOSAL (sin precio) ════ */}
        {phase === "proposal" && (
          <div className="fu">
            <div className="propw">

              <div className="prop-hero">
                <div className="ph-eye">Ruta de Acción · Sightline Advisory</div>
                <h1>El screening es el punto<br />de partida, no el destino.</h1>
                <p>Los hallazgos de este screening señalan dónde están las brechas. El siguiente paso es el <strong style={{color:"var(--text)"}}>Diagnóstico Comercial Intensivo</strong> — 3 semanas de análisis profundo que culminan en el <strong style={{color:"var(--gold)"}}>Programa Ejecutivo de 90 días</strong>, donde ocurre la transformación real del sistema comercial.</p>
                <div className="ph-tags">
                  <div className="ptag">Empresa: <b>{company.name}</b></div>
                  <div className="ptag">Sector: <b>{company.subIndustry}</b></div>
                  <div className="ptag">Alcance: <b>{scopeObj?.label}</b></div>
                  <div className="ptag">Score screening: <b style={{ color: interp?.color }}>{scores.total100}/100 — {interp?.label}</b></div>
                </div>
              </div>

              {/* Áreas críticas detectadas */}
              <div className="psec">
                <h3>Lo que el screening señala en {company.name}</h3>
                <p className="ps-sub">Las 3 dimensiones con mayor brecha — y mayor oportunidad de impacto</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {BLOCKS.map(b => ({ ...b, score: scores.blockScores[b.id] }))
                    .filter(b => b.score != null)
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                    .map(b => (
                      <div key={b.id} style={{ display: "flex", gap: 14, alignItems: "center", background: "var(--bg3)", border: `1px solid ${b.color}22`, borderRadius: 10, padding: "13px 16px" }}>
                        <span style={{ fontSize: 22 }}>{b.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: b.color, letterSpacing: ".06em", textTransform: "uppercase" }}>{b.name}</div>
                          <div style={{ fontSize: 12, color: "var(--mt)", marginTop: 3 }}>{b.description}</div>
                        </div>
                        <div style={{ fontSize: 22, fontFamily: "Playfair Display", fontWeight: 700, color: b.color }}>
                          {b.score.toFixed(1)}<span style={{ fontSize: 13, opacity: .5 }}>/5</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* La ruta completa: diagnóstico → programa */}
              <div className="psec">
                <h3>La ruta Sightline: de los hallazgos a la transformación</h3>
                <p className="ps-sub">Dos etapas secuenciales con un objetivo claro — un sistema comercial que funciona sin depender de personas clave</p>

                {/* Etapa 1: Diagnóstico */}
                <div style={{marginBottom:24}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                    <div style={{background:"rgba(200,169,110,0.12)",border:"1px solid rgba(200,169,110,0.3)",color:"var(--gold)",fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",padding:"4px 14px",borderRadius:20}}>
                      Etapa 1 · 3 Semanas
                    </div>
                    <div style={{fontSize:15,fontWeight:600}}>Diagnóstico Comercial Intensivo</div>
                  </div>
                  <div className="tl">
                    {[
                      { w: "S1", t: "Apertura ejecutiva + Entrevistas clave", d: "Alineación de alcance, mapeo del sistema actual, entrevistas con CEO y directores." },
                      { w: "S1", t: "Levantamiento documental", d: "Revisión de incentivos, reportes comerciales, pipeline e insumos financieros." },
                      { w: "S2", t: "Análisis cuantitativo de pipeline y métricas", d: "Diagnóstico de conversiones, cuellos de botella, dependencia de personas y margen." },
                      { w: "S2", t: "Taller de hipótesis — Executive Working Session", d: "Validación de hallazgos con el equipo directivo y priorización de focos." },
                      { w: "S3", t: "Arquitectura objetivo + Roadmap 90 días", d: "Diseño del sistema comercial ideal y plan de implementación priorizado." },
                      { w: "S3", t: "Informe ejecutivo + Presentación Board", d: "Documento board-ready con hallazgos, arquitectura y hoja de ruta." },
                    ].map((item, i) => (
                      <div className="tl-i" key={i}>
                        <div className="tl-d">{item.w}</div>
                        <div className="tl-b"><h4>{item.t}</h4><p>{item.d}</p></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flecha de transición */}
                <div style={{textAlign:"center",padding:"8px 0 20px",color:"var(--mt)",fontSize:13}}>
                  ↓ <span style={{letterSpacing:".08em"}}>El diagnóstico define el plan exacto de la siguiente etapa</span>
                </div>

                {/* Etapa 2: Programa Ejecutivo */}
                <div style={{background:"linear-gradient(135deg,rgba(74,144,196,0.07),rgba(200,169,110,0.05))",border:"1px solid rgba(74,144,196,0.2)",borderRadius:12,padding:"20px 22px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{background:"rgba(74,144,196,0.12)",border:"1px solid rgba(74,144,196,0.3)",color:"var(--blue2)",fontSize:11,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",padding:"4px 14px",borderRadius:20}}>
                      Etapa 2 · 90 Días
                    </div>
                    <div style={{fontSize:15,fontWeight:600}}>Programa Ejecutivo de Transformación</div>
                  </div>
                  <p style={{fontSize:13,color:"var(--mt2)",lineHeight:1.65}}>
                    Implementación estructurada de la arquitectura comercial diseñada en el diagnóstico. Acompañamiento ejecutivo directo con Sightline para rediseñar el sistema, instalar disciplinas y asegurar que los cambios queden operando de forma autónoma — sin depender de nosotros.
                  </p>
                </div>
              </div>

              {/* Próximos pasos — sin precio */}
              <div className="psec">
                <h3>¿Cómo avanzamos desde aquí?</h3>
                <p className="ps-sub">El camino desde el screening hasta la transformación del sistema comercial</p>
                <div className="next-steps-grid">
                  <div className="ns-card">
                    <div className="ns-num">01</div>
                    <div className="ns-title">Revisión de resultados</div>
                    <div className="ns-desc">30 minutos con el equipo Sightline para revisar los hallazgos del screening y validar si hay fit para el diagnóstico.</div>
                  </div>
                  <div className="ns-card">
                    <div className="ns-num">02</div>
                    <div className="ns-title">Diagnóstico · 3 semanas</div>
                    <div className="ns-desc">Análisis profundo del sistema comercial real. Entregable: arquitectura objetivo, hallazgos estructurados y Roadmap de 90 días.</div>
                  </div>
                  <div className="ns-card">
                    <div className="ns-num">03</div>
                    <div className="ns-title">Programa Ejecutivo · 90 días</div>
                    <div className="ns-desc">Implementación acompañada de la arquitectura diseñada. El sistema comercial queda operando de forma autónoma y escalable.</div>
                  </div>
                </div>
              </div>

              {/* CTA agenda */}
              <div className="agenda-box">
                <div className="ag-title">El primer paso es una conversación</div>
                <div className="ag-sub">
                  Agendamos 30 minutos para revisar juntos los resultados del screening de {company.name} — y si hay fit, diseñamos el alcance del Diagnóstico Comercial Intensivo.
                </div>
                <button className="bp" onClick={() => window.open(
                  `mailto:hola@sightlineadvisory.co?subject=Screening completado — ${company.name}&body=Hola equipo Sightline,%0D%0A%0D%0ACompletamos el screening de ${company.name} (${company.subIndustry}, operación ${scopeObj?.label}) con un score de ${scores.total100}/100 (${interp?.label}).%0D%0A%0D%0ANos gustaría agendar la reunión de revisión de resultados.%0D%0A%0D%0AContacto: ${company.contact || "—"}`, "_blank")}>
                  Agendar Revisión de Resultados →
                </button>
                <div className="ag-note">La propuesta económica formal se presenta después de la reunión de revisión.</div>
              </div>

              <div className="ctar">
                <button className="bg-btn" onClick={() => go("results")}>← Volver a Resultados</button>
              </div>

              <div className="pfoot">
                <div className="pf-logo">SIGHTLINE</div>
                <div className="pf-tag">Advisory · Estrategia en Ejecución</div>
                <div className="pf-url">www.sightlineadvisory.co</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
