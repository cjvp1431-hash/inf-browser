import React, { useState } from "react";
import { useStore } from "../store";
import {
  calcularPatrimonioNeto,
  calcularLiquidezProtegida,
  calcularLiquidezDisponible,
  determinarFase,
  calcularNivel,
  generarMensajeAdvisor,
} from "../engine";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

const FASE_NOMBRES = { 1: "Recuperación", 2: "Estabilidad", 3: "Acumulación" };

export default function WealthAdvisor() {
  const { state } = useStore();
  const [activeInsight, setActiveInsight] = useState<string | null>(null);

  const fase = determinarFase(state.cuentas, state.deudas);
  const nivel = calcularNivel(calcularLiquidezProtegida(state.cuentas));
  const patrimonioNeto = calcularPatrimonioNeto(state.cuentas, state.deudas);
  const liquidezProtegida = calcularLiquidezProtegida(state.cuentas);
  const liquidezDisponible = calcularLiquidezDisponible(state.cuentas);
  const totalDeudas = state.deudas.reduce((s, d) => s + d.balance, 0);

  const mensaje = generarMensajeAdvisor(state);

  const insights = generarInsights(fase, patrimonioNeto, liquidezProtegida, liquidezDisponible, totalDeudas);

  return (
    <div style={{ padding: "20px 16px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(145deg, #0a0a1a 0%, #1a1a3e 100%)",
        borderRadius: 20,
        padding: "24px",
        marginBottom: 20,
        color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4facfe, #00f2fe)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>VP Wealth Advisor</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Análisis financiero personal</div>
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "14px",
          borderLeft: "3px solid #4facfe",
        }}>
          <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: "italic", opacity: 0.95 }}>
            "{mensaje}"
          </div>
        </div>
      </div>

      {/* Status card */}
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "16px",
        marginBottom: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        border: "1px solid #f0f0f0",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
          Diagnóstico Actual
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <DiagCard label="Fase" value={`${fase} – ${FASE_NOMBRES[fase]}`} color={fase === 1 ? "#e74c3c" : fase === 2 ? "#f39c12" : "#27ae60"} />
          <DiagCard label="Nivel" value={`${nivel.nivel} – ${nivel.nombre}`} color="#5c6bc0" />
          <DiagCard label="Patrimonio Neto" value={fmt(patrimonioNeto)} color={patrimonioNeto > 0 ? "#27ae60" : "#e74c3c"} />
          <DiagCard label="Liquidez Protegida" value={fmt(liquidezProtegida)} color="#3498db" />
        </div>
      </div>

      {/* Insights */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Alertas y Recomendaciones
      </div>
      {insights.map((insight, i) => (
        <InsightCard
          key={i}
          insight={insight}
          expanded={activeInsight === String(i)}
          onToggle={() => setActiveInsight(activeInsight === String(i) ? null : String(i))}
        />
      ))}

      {/* Principios */}
      <div style={{ marginTop: 20, background: "#f8f9fa", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>
          Principios del Sistema WealthOS
        </div>
        {[
          { icon: "⚡", text: "El dinero disponible desaparece. Asigna en menos de 24 horas." },
          { icon: "🎯", text: "30% de cada ingreso al patrimonio. Sin negociar." },
          { icon: "🛡️", text: "Fondo de emergencia primero. Sin él no hay construcción." },
          { icon: "🏗️", text: "Construye activos, no solo ahorra. Cada peso trabaja." },
          { icon: "🔄", text: "Ingresos extraordinarios = oportunidad extraordinaria." },
        ].map((p, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            paddingBottom: 10,
            marginBottom: 10,
            borderBottom: i < 4 ? "1px solid #e9ecef" : "none",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
            <span style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>{p.text}</span>
          </div>
        ))}
      </div>

      {/* Proyección */}
      <ProyeccionCard patrimonioNeto={patrimonioNeto} />
    </div>
  );
}

function DiagCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function InsightCard({ insight, expanded, onToggle }: {
  insight: { tipo: "alerta" | "oportunidad" | "info"; titulo: string; detalle: string };
  expanded: boolean;
  onToggle: () => void;
}) {
  const iconMap = { alerta: "⚠️", oportunidad: "💡", info: "ℹ️" };
  const colorMap = { alerta: "#e74c3c", oportunidad: "#27ae60", info: "#3498db" };
  const bgMap = { alerta: "#fdf0ef", oportunidad: "#edfaf1", info: "#ebf5fb" };

  return (
    <div
      style={{
        background: bgMap[insight.tipo],
        borderRadius: 14,
        padding: "14px",
        marginBottom: 8,
        border: `1px solid ${colorMap[insight.tipo]}22`,
        cursor: "pointer",
      }}
      onClick={onToggle}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{iconMap[insight.tipo]}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: colorMap[insight.tipo] }}>{insight.titulo}</span>
        </div>
        <span style={{ color: "#aaa", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#555", lineHeight: 1.5, paddingLeft: 26 }}>
          {insight.detalle}
        </div>
      )}
    </div>
  );
}

function ProyeccionCard({ patrimonioNeto }: { patrimonioNeto: number }) {
  const escenarios = [
    { label: "Conservador (15%/mes)", ahorroMensual: 22_500 },
    { label: "Base (30%/mes)", ahorroMensual: 45_000 },
    { label: "Agresivo (40%/mes)", ahorroMensual: 60_000 },
  ];
  const META = 10_000_000;
  const base = Math.max(0, patrimonioNeto);

  return (
    <div style={{ marginTop: 16, background: "#f8f9fa", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>
        Proyección a RD$10M
      </div>
      {escenarios.map((e) => {
        const meses = e.ahorroMensual > 0 ? Math.ceil((META - base) / e.ahorroMensual) : 9999;
        const años = (meses / 12).toFixed(1);
        return (
          <div key={e.label} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 8,
            marginBottom: 8,
            borderBottom: "1px solid #e9ecef",
          }}>
            <span style={{ fontSize: 12, color: "#666" }}>{e.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{años} años</span>
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
        Basado en ingreso promedio RD$150,000/mes. Proyección referencial.
      </div>
    </div>
  );
}

function generarInsights(
  fase: 1 | 2 | 3,
  patrimonioNeto: number,
  liquidezProtegida: number,
  liquidezDisponible: number,
  totalDeudas: number
) {
  const insights: { tipo: "alerta" | "oportunidad" | "info"; titulo: string; detalle: string }[] = [];

  if (liquidezDisponible > 20_000) {
    insights.push({
      tipo: "alerta",
      titulo: "Dinero visible en cuenta operativa",
      detalle: `Tienes ${new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(liquidezDisponible)} disponibles y sin asignar. Este dinero tiene menos de 48 horas antes de comenzar a desaparecer en gastos no planificados.`,
    });
  }

  if (liquidezProtegida < 50_000) {
    insights.push({
      tipo: "alerta",
      titulo: "Sin colchón financiero básico",
      detalle: "Menos de RD$50,000 protegidos. Cualquier emergencia te desestabiliza. Prioridad #1: construir el fondo de emergencia.",
    });
  }

  if (fase === 1) {
    insights.push({
      tipo: "info",
      titulo: "Sistema en modo recuperación",
      detalle: "Las tarjetas altas y la baja liquidez protegida definen la fase actual. La meta es clara: reducir tarjetas por debajo del 50% y llevar el fondo de emergencia a RD$100K.",
    });
  }

  if (fase >= 2 && liquidezProtegida >= 100_000) {
    insights.push({
      tipo: "oportunidad",
      titulo: "Listo para acumulación patrimonial",
      detalle: "Has alcanzado estabilidad básica. Ahora el foco debe ser construir activos, no solo guardar efectivo. Considera instrumentos de renta fija y el inicio del fondo de inmueble.",
    });
  }

  if (totalDeudas > 500_000) {
    insights.push({
      tipo: "info",
      titulo: "Deudas por encima de RD$500K",
      detalle: "El préstamo del vehículo representa la mayor parte. Considera destinaciones agresivas cuando ingresos extraordinarios lleguen para reducir el balance.",
    });
  }

  insights.push({
    tipo: "oportunidad",
    titulo: "Potencial de ingreso extraordinario",
    detalle: "Si recibes un ingreso de RD$500K o más, el sistema recomienda capturar el 40% (RD$200K) directo a patrimonio. Esto puede acelerar la construcción patrimonial significativamente.",
  });

  return insights;
}
