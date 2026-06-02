import React from "react";
import { useStore } from "../store";
import {
  calcularLiquidezProtegida,
  calcularLiquidezDisponible,
  calcularEfectivoTotal,
  calcularPatrimonioAcumulado,
  calcularPatrimonioNetoV2,
  calcularTotalPasivos,
  determinarFaseV2,
  calcularNivel,
  calcularProgreso,
  calcularFechaEstimada,
  calcularHealthScore,
  calcularObjetivoDinamico,
} from "../engine";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

const FASE_INFO = {
  1: { label: "Fase 1 – Recuperación", color: "#e74c3c", bg: "#fdf0ef" },
  2: { label: "Fase 2 – Estabilidad",  color: "#f39c12", bg: "#fef9ef" },
  3: { label: "Fase 3 – Acumulación",  color: "#27ae60", bg: "#edfaf1" },
};

const NIVEL_ICONS = ["🌱", "🌿", "🏗️", "📈", "💼", "🦅", "👑"];

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { state } = useStore();

  const liquidezProtegida   = calcularLiquidezProtegida(state.cuentas);
  const liquidezDisponible  = calcularLiquidezDisponible(state.cuentas);
  const efectivoTotal       = calcularEfectivoTotal(state.cuentas);
  const patrimonioAcumulado = calcularPatrimonioAcumulado(state);
  const patrimonioNeto      = calcularPatrimonioNetoV2(state);
  const totalPasivos        = calcularTotalPasivos(state);
  const fase                = determinarFaseV2(state);
  const nivel               = calcularNivel(liquidezProtegida);
  const health              = calcularHealthScore(state);
  const objetivo            = calcularObjetivoDinamico(state);
  const progresoObjetivo    = calcularProgreso(objetivo.actual, objetivo.meta);
  const progresoMeta        = calcularProgreso(Math.max(0, patrimonioNeto), state.metaFinal);
  const progresoNivel       = calcularProgreso(liquidezProtegida - nivel.min, (nivel.max === Infinity ? 10_000_000 : nivel.max) - nivel.min);
  const fechaEstimada       = calcularFechaEstimada(Math.max(0, patrimonioNeto), state.metaFinal);
  const faseInfo            = FASE_INFO[fase];

  return (
    <div style={{ padding: "0 0 24px" }}>

      {/* ─── Health Score + Efectivo hero ─────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, #0a0a1a 0%, #1a1a3e 100%)",
        borderRadius: "24px", padding: "22px 20px",
        margin: "0 16px 16px", color: "#fff",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
              Efectivo Total
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>{fmt(efectivoTotal)}</div>
          </div>
          {/* Health Score badge */}
          <div style={{
            background: "rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "10px 14px", textAlign: "center",
            border: `2px solid ${health.color}44`,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: health.color, lineHeight: 1 }}>{health.score}</div>
            <div style={{ fontSize: 10, color: health.color, marginTop: 2, fontWeight: 600, letterSpacing: 0.5 }}>{health.clasificacion}</div>
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>HEALTH</div>
          </div>
        </div>

        {/* Objetivo dinámico */}
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.5, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                Objetivo Actual
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{objetivo.label}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4facfe" }}>
              {progresoObjetivo.toFixed(0)}%
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 6 }}>
            <div style={{
              width: `${progresoObjetivo}%`, height: "100%",
              background: "linear-gradient(90deg, #4facfe, #00f2fe)",
              borderRadius: 4, transition: "width 0.8s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, opacity: 0.5 }}>{fmt(objetivo.actual)}</span>
            <span style={{ fontSize: 11, opacity: 0.5 }}>
              Falta {fmt(Math.max(0, objetivo.meta - objetivo.actual))}
            </span>
          </div>
        </div>

        {/* Nivel badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px",
          }}>
            <span style={{ fontSize: 14 }}>{NIVEL_ICONS[nivel.nivel - 1]}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Nivel {nivel.nivel} – {nivel.nombre}</span>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: `${faseInfo.color}22`, borderRadius: 20, padding: "4px 10px",
            border: `1px solid ${faseInfo.color}44`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: faseInfo.color, display: "inline-block" }} />
            <span style={{ fontSize: 11, color: faseInfo.color, fontWeight: 600 }}>F{fase}</span>
          </div>
        </div>
      </div>

      {/* ─── Stats grid 2×2 ──────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px 14px" }}>
        <StatCard label="Dinero Protegido"     value={fmt(liquidezProtegida)}   icon="🛡️" accent="#3498db" />
        <StatCard label="Patrimonio Acumulado" value={fmt(patrimonioAcumulado)} icon="📈" accent="#9b59b6" />
        <StatCard label="Deudas Totales"       value={fmt(totalPasivos)}        icon="📊" accent="#e74c3c" negative />
        <StatCard label="Disponible Hoy"       value={fmt(liquidezDisponible)}  icon="💵" accent="#27ae60" />
      </div>

      {/* ─── Health Score breakdown ───────────────────────────────────── */}
      <div style={{ margin: "0 16px 14px", background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Salud Financiera</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: health.color }}>{health.score}/100</span>
        </div>
        <div style={{ display: "flex", height: 8, borderRadius: 6, overflow: "hidden", gap: 2, marginBottom: 10 }}>
          {[
            { key: "liquidez", label: "Liquidez", val: health.factores.liquidez },
            { key: "tarjetas", label: "Tarjetas", val: health.factores.tarjetas },
            { key: "deuda",    label: "Deuda",    val: health.factores.deuda    },
            { key: "captura",  label: "Captura",  val: health.factores.captura  },
            { key: "patrimonio",label:"Patrimonio",val: health.factores.patrimonio},
          ].map((f) => (
            <div key={f.key} style={{ flex: f.val + 1, background: f.val >= 15 ? "#27ae60" : f.val >= 10 ? "#f39c12" : "#e74c3c", borderRadius: 3 }} title={`${f.label}: ${f.val}/20`} />
          ))}
        </div>
        <div style={{
          background: health.score >= 61 ? "#edfaf1" : health.score >= 41 ? "#fef9ef" : "#fdf0ef",
          borderRadius: 10, padding: "8px 12px",
          borderLeft: `3px solid ${health.color}`,
        }}>
          <span style={{ fontSize: 12, color: health.score >= 61 ? "#27ae60" : health.score >= 41 ? "#f39c12" : "#e74c3c", fontWeight: 600 }}>
            {health.clasificacion} — {health.score >= 81 ? "Sistema sólido. Mantén el ritmo." : health.score >= 61 ? "Base establecida. Sigue construyendo." : health.score >= 41 ? "En proceso. La consistencia te saca de aquí." : "Prioridad: estabilizar antes de crecer."}
          </span>
        </div>
      </div>

      {/* ─── Nivel progress ──────────────────────────────────────────── */}
      <div style={{ margin: "0 16px 14px", background: "#f8f9fa", borderRadius: 16, padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>
              {NIVEL_ICONS[nivel.nivel - 1]} Nivel {nivel.nivel} → {Math.min(7, nivel.nivel + 1)}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
              {fmt(nivel.min)} → {fmt(nivel.max === Infinity ? 10_000_000 : nivel.max)}
            </div>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#5c6bc0" }}>{progresoNivel.toFixed(0)}%</span>
        </div>
        <div style={{ background: "#e9ecef", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ width: `${progresoNivel}%`, height: "100%", background: "linear-gradient(90deg, #667eea, #764ba2)", borderRadius: 6, transition: "width 0.8s ease" }} />
        </div>
        <div style={{ fontSize: 11, color: "#aaa", textAlign: "right" }}>
          Falta {fmt(Math.max(0, (nivel.max === Infinity ? 10_000_000 : nivel.max) - liquidezProtegida))} para Nivel {Math.min(7, nivel.nivel + 1)}
        </div>
      </div>

      {/* ─── Meta final (secondary) ──────────────────────────────────── */}
      <div style={{ margin: "0 16px 16px", background: "#fff", borderRadius: 16, padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Meta Final RD$10,000,000</span>
          <span style={{ fontSize: 12, color: "#aaa" }}>Est. {fechaEstimada}</span>
        </div>
        <div style={{ background: "#f0f0f0", borderRadius: 6, height: 6, overflow: "hidden", marginBottom: 4 }}>
          <div style={{ width: `${progresoMeta}%`, height: "100%", background: "linear-gradient(90deg, #4facfe, #00f2fe)", borderRadius: 6, transition: "width 0.8s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#bbb" }}>{fmt(Math.max(0, patrimonioNeto))}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4facfe" }}>{progresoMeta.toFixed(2)}%</span>
        </div>
      </div>

      {/* ─── Quick actions ───────────────────────────────────────────── */}
      <div style={{ margin: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ActionBtn label="Registrar Ingreso" icon="💰" onClick={() => onNavigate("ingreso")} primary />
        <ActionBtn label="Mi Mundo"          icon="🌐" onClick={() => onNavigate("mimundo")} />
        <ActionBtn label="Distribuir"        icon="📐" onClick={() => onNavigate("distribucion")} />
        <ActionBtn label="Advisor IA"        icon="🤖" onClick={() => onNavigate("advisor")} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent, negative }: {
  label: string; value: string; icon: string; accent: string; negative?: boolean;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: negative ? "#e74c3c" : "#1a1a2e", letterSpacing: -0.3 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function ActionBtn({ label, icon, onClick, primary }: { label: string; icon: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: primary ? "linear-gradient(135deg, #0a0a1a, #1a1a3e)" : "#f8f9fa",
      color: primary ? "#fff" : "#1a1a2e",
      border: "none", borderRadius: 14, padding: "14px 12px",
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 8, width: "100%",
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>{label}
    </button>
  );
}
