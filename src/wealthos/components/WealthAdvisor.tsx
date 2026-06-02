import React, { useState } from "react";
import { useStore } from "../store";
import {
  calcularPatrimonioNetoV2, calcularLiquidezProtegida,
  calcularLiquidezDisponible, determinarFaseV2,
  calcularNivel, calcularHealthScore, calcularRankingDeudas,
  calcularTotalPasivos, calcularUtilizacionTotal,
  generarMensajeAdvisor, TASA_COLORS,
} from "../engine";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

const FASE_NOMBRES = { 1: "Recuperación", 2: "Estabilidad", 3: "Acumulación" };

export default function WealthAdvisor() {
  const { state } = useStore();
  const [expanded, setExpanded] = useState<string | null>(null);

  const fase = determinarFaseV2(state);
  const nivel = calcularNivel(calcularLiquidezProtegida(state.cuentas));
  const patrimonioNeto = calcularPatrimonioNetoV2(state);
  const liquidezProtegida = calcularLiquidezProtegida(state.cuentas);
  const liquidezDisponible = calcularLiquidezDisponible(state.cuentas);
  const totalPasivos = calcularTotalPasivos(state);
  const health = calcularHealthScore(state);
  const ranking = calcularRankingDeudas(state);
  const tarjetas = state.tarjetas ?? [];
  const inversiones = state.inversiones ?? [];
  const utilizacionTotal = calcularUtilizacionTotal(tarjetas);

  const mensaje = generarMensajeAdvisor(state);
  const insights = generarInsights(state, fase, patrimonioNeto, liquidezProtegida, liquidezDisponible, totalPasivos, ranking, tarjetas, inversiones, utilizacionTotal);

  return (
    <div style={{ padding: "4px 16px 24px" }}>

      {/* ─── Advisor header ───────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, #0a0a1a 0%, #1a1a3e 100%)",
        borderRadius: 20, padding: "22px", marginBottom: 16, color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%",
            background: "linear-gradient(135deg, #4facfe, #00f2fe)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>🤖</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>VP Wealth Advisor</div>
            <div style={{ fontSize: 11, opacity: 0.55 }}>Análisis financiero personal · CFO mode</div>
          </div>
          {/* Health badge */}
          <div style={{ marginLeft: "auto", background: `${health.color}22`, borderRadius: 12, padding: "6px 10px", border: `1px solid ${health.color}44`, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: health.color }}>{health.score}</div>
            <div style={{ fontSize: 9, color: health.color, fontWeight: 600 }}>{health.clasificacion}</div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "13px", borderLeft: "3px solid #4facfe" }}>
          <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: "italic", opacity: 0.95 }}>
            "{mensaje}"
          </div>
        </div>
      </div>

      {/* ─── Diagnóstico ──────────────────────────────────────── */}
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Diagnóstico</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <DiagCard label="Fase" value={`${fase} – ${FASE_NOMBRES[fase]}`} color={fase === 1 ? "#e74c3c" : fase === 2 ? "#f39c12" : "#27ae60"} />
          <DiagCard label="Nivel" value={`${nivel.nivel} – ${nivel.nombre}`} color="#5c6bc0" />
          <DiagCard label="Patrimonio" value={fmt(patrimonioNeto)} color={patrimonioNeto >= 0 ? "#27ae60" : "#e74c3c"} />
          <DiagCard label="Pasivos" value={fmt(totalPasivos)} color="#e74c3c" />
          {tarjetas.length > 0 && (
            <DiagCard label="Util. tarjetas" value={`${utilizacionTotal.toFixed(0)}%`} color={utilizacionTotal >= 80 ? "#e74c3c" : utilizacionTotal >= 50 ? "#f39c12" : "#27ae60"} />
          )}
          <DiagCard label="Liquidez" value={fmt(liquidezProtegida)} color="#3498db" />
        </div>
      </div>

      {/* ─── Ranking de deudas ────────────────────────────────── */}
      {ranking.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Ranking de Deudas</div>
          {ranking.map((d, i) => {
            const PRIORIDAD_COLORS = { critica: "#e74c3c", alta: "#e67e22", media: "#f39c12", baja: "#27ae60" };
            return (
              <div key={d.id} style={{
                display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: 10,
                marginBottom: 10, borderBottom: i < ranking.length - 1 ? "1px solid #f5f5f5" : "none",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 8, background: PRIORIDAD_COLORS[d.prioridad],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0, marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{d.nombre}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e74c3c", marginLeft: 8 }}>{fmt(d.balance)}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{d.razon}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                    <span style={{ fontSize: 10, background: TASA_COLORS[d.clasificacionTasa], color: "#fff", borderRadius: 6, padding: "2px 6px", fontWeight: 600 }}>
                      {d.tasaAnual}%
                    </span>
                    <span style={{ fontSize: 10, background: `${PRIORIDAD_COLORS[d.prioridad]}22`, color: PRIORIDAD_COLORS[d.prioridad], borderRadius: 6, padding: "2px 6px", fontWeight: 600, border: `1px solid ${PRIORIDAD_COLORS[d.prioridad]}44` }}>
                      {d.prioridad}
                    </span>
                    {d.utilizacion !== undefined && (
                      <span style={{ fontSize: 10, color: "#888", background: "#f0f0f0", borderRadius: 6, padding: "2px 6px" }}>
                        {d.utilizacion.toFixed(0)}% util.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Insights ─────────────────────────────────────────── */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Alertas y Recomendaciones
      </div>
      {insights.map((insight, i) => (
        <InsightCard
          key={i} insight={insight}
          expanded={expanded === String(i)}
          onToggle={() => setExpanded(expanded === String(i) ? null : String(i))}
        />
      ))}

      {/* ─── Principios ───────────────────────────────────────── */}
      <div style={{ marginTop: 16, background: "#f8f9fa", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>Principios del Sistema</div>
        {[
          { icon: "⚡", text: "El dinero disponible desaparece. Asigna en menos de 24 horas." },
          { icon: "🎯", text: "30% de cada ingreso al patrimonio. Sin negociar." },
          { icon: "🛡️", text: "Fondo de emergencia primero. Sin él no hay construcción real." },
          { icon: "📊", text: "Deuda costosa antes que inversión. La rentabilidad garantizada gana." },
          { icon: "🔄", text: "Ingresos extraordinarios = oportunidad extraordinaria. 40%." },
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: i < 4 ? "1px solid #e9ecef" : "none" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
            <span style={{ fontSize: 13, color: "#555", lineHeight: 1.4 }}>{p.text}</span>
          </div>
        ))}
      </div>

      {/* ─── Proyección ───────────────────────────────────────── */}
      <ProyeccionCard patrimonioNeto={patrimonioNeto} />
    </div>
  );
}

function DiagCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function InsightCard({ insight, expanded, onToggle }: {
  insight: { tipo: "alerta" | "oportunidad" | "info"; titulo: string; detalle: string };
  expanded: boolean; onToggle: () => void;
}) {
  const iconMap = { alerta: "⚠️", oportunidad: "💡", info: "ℹ️" };
  const colorMap = { alerta: "#e74c3c", oportunidad: "#27ae60", info: "#3498db" };
  const bgMap = { alerta: "#fdf0ef", oportunidad: "#edfaf1", info: "#ebf5fb" };
  return (
    <div onClick={onToggle} style={{ background: bgMap[insight.tipo], borderRadius: 14, padding: "14px", marginBottom: 8, border: `1px solid ${colorMap[insight.tipo]}22`, cursor: "pointer" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{iconMap[insight.tipo]}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: colorMap[insight.tipo] }}>{insight.titulo}</span>
        </div>
        <span style={{ color: "#aaa", fontSize: 14 }}>{expanded ? "▲" : "▼"}</span>
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
  const base = Math.max(0, patrimonioNeto);
  const META = 10_000_000;
  return (
    <div style={{ marginTop: 16, background: "#f8f9fa", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>Proyección a RD$10M</div>
      {[
        { label: "Conservador (RD$22,500/mes)", ahorro: 22_500 },
        { label: "Base (RD$45,000/mes)",        ahorro: 45_000 },
        { label: "Agresivo (RD$60,000/mes)",    ahorro: 60_000 },
      ].map((e) => {
        const años = ((META - base) / (e.ahorro * 12)).toFixed(1);
        return (
          <div key={e.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #e9ecef" }}>
            <span style={{ fontSize: 12, color: "#666" }}>{e.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{años} años</span>
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: "#aaa" }}>Proyección referencial. No incluye rendimiento de inversiones.</div>
    </div>
  );
}

function generarInsights(state: any, fase: number, patrimonioNeto: number, liquidezProtegida: number, liquidezDisponible: number, totalPasivos: number, ranking: any[], tarjetas: any[], inversiones: any[], utilizacionTotal: number) {
  const list: { tipo: "alerta" | "oportunidad" | "info"; titulo: string; detalle: string }[] = [];

  if (liquidezDisponible > 20_000) {
    list.push({ tipo: "alerta", titulo: "Dinero visible sin asignar", detalle: `Tienes ${fmt(liquidezDisponible)} disponibles. Este dinero tiene menos de 48 horas antes de comenzar a desaparecer. Asigna ahora.` });
  }

  if (liquidezProtegida < 50_000) {
    list.push({ tipo: "alerta", titulo: "Sin colchón financiero básico", detalle: "Menos de RD$50,000 protegidos. Cualquier emergencia te desestabiliza. Prioridad absoluta: fondo de emergencia." });
  }

  // Tarjeta con tasa crítica
  const tarjetaCritica = ranking.find((d) => d.tipo === "tarjeta" && d.tasaAnual > 40);
  if (tarjetaCritica) {
    const costoAnual = tarjetaCritica.balance * tarjetaCritica.tasaAnual / 100;
    list.push({ tipo: "alerta", titulo: `Tasa ${tarjetaCritica.tasaAnual}% en ${tarjetaCritica.nombre}`, detalle: `Esta tarjeta te cuesta aproximadamente ${fmt(costoAnual)} al año en intereses. La rentabilidad garantizada de reducir esta deuda supera invertir ese dinero en cualquier instrumento convencional.` });
  }

  // Comparar deuda vs inversión
  if (inversiones.length > 0) {
    const tasaDeudaMasCara = ranking[0]?.tasaAnual ?? 0;
    const tasaInversion = Math.max(...inversiones.map((i: any) => i.rendimientoEsperadoAnual));
    if (tasaDeudaMasCara > tasaInversion * 1.5) {
      list.push({ tipo: "alerta", titulo: "Deuda más costosa que inversión", detalle: `Tu deuda más cara cuesta ${tasaDeudaMasCara}% anual vs ${tasaInversion}% de rendimiento esperado en inversiones. Pagar deuda antes genera más valor garantizado.` });
    }
  }

  if (utilizacionTotal > 80) {
    list.push({ tipo: "alerta", titulo: `Utilización de tarjetas: ${utilizacionTotal.toFixed(0)}%`, detalle: "Utilización por encima del 80% afecta capacidad de acceso a crédito futuro y señala estrés de liquidez. Meta: bajar a menos del 50%." });
  }

  if (fase === 1) {
    list.push({ tipo: "info", titulo: "Sistema en modo recuperación", detalle: "Las tarjetas altas y baja liquidez protegida definen la fase actual. La meta es clara: fondo de emergencia RD$100K + tarjetas bajo 50%. No saltes a 'inversión' todavía." });
  }

  if (fase >= 2 && liquidezProtegida >= 100_000) {
    list.push({ tipo: "oportunidad", titulo: "Listo para acumulación patrimonial", detalle: "Estabilidad básica alcanzada. Ahora el foco es construir activos productivos, no solo guardar efectivo. Considera instrumentos de renta fija en Popular y el inicio del fondo inmueble." });
  }

  list.push({ tipo: "oportunidad", titulo: "Potencial ingreso extraordinario", detalle: "Si recibes RD$500K o más, el sistema captura 40% directo a patrimonio (RD$200K). Ese movimiento en un solo ingreso puede equivaler a 4 meses de acumulación normal." });

  return list;
}
