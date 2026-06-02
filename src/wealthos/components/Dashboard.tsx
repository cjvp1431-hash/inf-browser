import React from "react";
import { useStore } from "../store";
import {
  calcularPatrimonioNeto,
  calcularLiquidezProtegida,
  calcularLiquidezDisponible,
  calcularTotalDeudas,
  determinarFase,
  calcularNivel,
  calcularProgreso,
  calcularFechaEstimada,
} from "../engine";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

const FASE_INFO = {
  1: { label: "Fase 1 – Recuperación", color: "#e74c3c", bg: "#fdf0ef" },
  2: { label: "Fase 2 – Estabilidad", color: "#f39c12", bg: "#fef9ef" },
  3: { label: "Fase 3 – Acumulación", color: "#27ae60", bg: "#edfaf1" },
};

export default function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { state } = useStore();
  const { cuentas, deudas, metaFinal } = state;

  const patrimonioNeto = calcularPatrimonioNeto(cuentas, deudas);
  const liquidezProtegida = calcularLiquidezProtegida(cuentas);
  const liquidezDisponible = calcularLiquidezDisponible(cuentas);
  const totalDeudas = calcularTotalDeudas(deudas);
  const fase = determinarFase(cuentas, deudas);
  const nivel = calcularNivel(liquidezProtegida);
  const progresoMeta = calcularProgreso(patrimonioNeto > 0 ? patrimonioNeto : 0, metaFinal);
  const progresoNivel = calcularProgreso(liquidezProtegida - nivel.min, nivel.max - nivel.min);
  const fechaEstimada = calcularFechaEstimada(patrimonioNeto > 0 ? patrimonioNeto : 0, metaFinal);
  const faseInfo = FASE_INFO[fase];

  return (
    <div style={{ padding: "0 0 24px" }}>
      {/* Hero card */}
      <div style={{
        background: "linear-gradient(145deg, #0a0a1a 0%, #1a1a3e 100%)",
        borderRadius: "24px",
        padding: "28px 24px",
        margin: "0 16px 20px",
        color: "#fff",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}>
        <div style={{ fontSize: 12, opacity: 0.6, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
          Patrimonio Neto
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: -1, marginBottom: 4 }}>
          {fmt(patrimonioNeto)}
        </div>
        <div style={{ fontSize: 13, opacity: 0.55, marginBottom: 20 }}>
          Meta final: {fmt(metaFinal)}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{progresoMeta.toFixed(2)}% completado</span>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Est. {fechaEstimada}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, height: 8, overflow: "hidden" }}>
            <div style={{
              width: `${progresoMeta}%`,
              height: "100%",
              background: "linear-gradient(90deg, #4facfe, #00f2fe)",
              borderRadius: 6,
              transition: "width 0.8s ease",
            }} />
          </div>
        </div>

        {/* Nivel badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.12)",
          borderRadius: 20,
          padding: "5px 12px",
          marginTop: 8,
        }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Nivel {nivel.nivel} – {nivel.nombre}</span>
        </div>
      </div>

      {/* Fase badge */}
      <div style={{ margin: "0 16px 16px" }}>
        <div style={{
          background: faseInfo.bg,
          border: `1px solid ${faseInfo.color}22`,
          borderRadius: 12,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: faseInfo.color }}>{faseInfo.label}</span>
          <div style={{ background: faseInfo.color, borderRadius: 8, padding: "2px 10px" }}>
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>ACTIVA</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "0 16px 16px" }}>
        <StatCard label="Liquidez Protegida" value={fmt(liquidezProtegida)} icon="🛡️" accent="#3498db" />
        <StatCard label="Disponible Hoy" value={fmt(liquidezDisponible)} icon="💵" accent="#27ae60" />
        <StatCard label="Total Deudas" value={fmt(totalDeudas)} icon="📊" accent="#e74c3c" negative />
        <StatCard label="Progreso Nivel" value={`${progresoNivel.toFixed(0)}%`} icon="🎯" accent="#9b59b6" />
      </div>

      {/* Nivel progress */}
      <div style={{ margin: "0 16px 16px", background: "#f8f9fa", borderRadius: 16, padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Nivel {nivel.nivel} → {nivel.nivel + 1}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{fmt(nivel.min)} → {fmt(nivel.max === Infinity ? 10_000_000 : nivel.max)}</div>
          </div>
          <div style={{ fontSize: 22 }}>
            {["🌱", "🌿", "🏗️", "📈", "💼", "🦅", "👑"][nivel.nivel - 1]}
          </div>
        </div>
        <div style={{ background: "#e9ecef", borderRadius: 6, height: 10, overflow: "hidden" }}>
          <div style={{
            width: `${progresoNivel}%`,
            height: "100%",
            background: "linear-gradient(90deg, #667eea, #764ba2)",
            borderRadius: 6,
            transition: "width 0.8s ease",
          }} />
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 6, textAlign: "right" }}>
          Faltante: {fmt(Math.max(0, nivel.max === Infinity ? 10_000_000 : nivel.max - liquidezProtegida))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ margin: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ActionButton label="Registrar Ingreso" icon="💰" onClick={() => onNavigate("ingreso")} primary />
        <ActionButton label="Ver Distribución" icon="📐" onClick={() => onNavigate("distribucion")} />
        <ActionButton label="Actualizar Cuentas" icon="🏦" onClick={() => onNavigate("cuentas")} />
        <ActionButton label="Advisor IA" icon="🤖" onClick={() => onNavigate("advisor")} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent, negative }: {
  label: string; value: string; icon: string; accent: string; negative?: boolean;
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "14px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      border: "1px solid #f0f0f0",
    }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: negative ? "#e74c3c" : "#1a1a2e", letterSpacing: -0.3 }}>
        {negative ? `−${value.replace("-", "")}` : value}
      </div>
      <div style={{ fontSize: 11, color: "#999", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function ActionButton({ label, icon, onClick, primary }: {
  label: string; icon: string; onClick: () => void; primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: primary ? "linear-gradient(135deg, #0a0a1a, #1a1a3e)" : "#f8f9fa",
        color: primary ? "#fff" : "#1a1a2e",
        border: "none",
        borderRadius: 14,
        padding: "14px 12px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        transition: "opacity 0.2s",
      }}
      onMouseDown={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseUp={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}
