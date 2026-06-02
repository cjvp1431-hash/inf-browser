import React from "react";
import { useStore } from "../store";
import { calcularPatrimonioNeto, calcularLiquidezProtegida, calcularProgreso } from "../engine";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

const METAS_FIJAS = [
  { id: "fondo-emergencia", label: "Fondo de Emergencia", icon: "🛡️", meta: 100_000, color: "#3498db", descripcion: "Fase 1: RD$100K → Fase 2: RD$200K" },
  { id: "patrimonio-total", label: "Patrimonio Total", icon: "👑", meta: 10_000_000, color: "#1a1a2e", descripcion: "Meta final de libertad financiera" },
  { id: "inmueble-futuro", label: "Inmueble Futuro", icon: "🏠", meta: 500_000, color: "#8e44ad", descripcion: "Capital semilla para primer inmueble" },
  { id: "vehiculo", label: "Vehículo Libre de Deuda", icon: "🚗", meta: 980_000, color: "#e67e22", descripcion: "Saldar préstamo vehículo" },
];

export default function Metas() {
  const { state } = useStore();
  const patrimonioNeto = calcularPatrimonioNeto(state.cuentas, state.deudas);
  const liquidezProtegida = calcularLiquidezProtegida(state.cuentas);

  const emergencia = state.cuentas.find((c) => c.id === "qik-emergencia");
  const inmueble = state.cuentas.find((c) => c.id === "qik-inmueble");
  const vehiculoDeuda = state.deudas.find((d) => d.id === "vehiculo");
  const vehiculoPagado = vehiculoDeuda ? Math.max(0, 980_000 - vehiculoDeuda.balance) : 980_000;

  const valores: Record<string, number> = {
    "fondo-emergencia": emergencia?.balance ?? 0,
    "patrimonio-total": Math.max(0, patrimonioNeto),
    "inmueble-futuro": inmueble?.balance ?? 0,
    "vehiculo": vehiculoPagado,
  };

  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={titleStyle}>Metas Patrimoniales</h2>

      {/* Qik metas */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Cuentas Qik
      </div>
      <div style={{ marginBottom: 20 }}>
        {state.cuentas
          .filter((c) => c.tipo === "meta")
          .map((c) => {
            const progreso = c.meta ? calcularProgreso(c.balance, c.meta) : 0;
            return (
              <MetaCard
                key={c.id}
                label={c.nombre.replace("Qik – ", "")}
                actual={c.balance}
                meta={c.meta}
                progreso={progreso}
                descripcion={c.descripcion}
                color="#00b894"
                icon="🎯"
              />
            );
          })}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Metas Clave
      </div>
      {METAS_FIJAS.map((m) => (
        <MetaCard
          key={m.id}
          label={m.label}
          actual={valores[m.id]}
          meta={m.meta}
          progreso={calcularProgreso(valores[m.id], m.meta)}
          descripcion={m.descripcion}
          color={m.color}
          icon={m.icon}
        />
      ))}

      {/* Hitos de tiempo */}
      <div style={{ marginTop: 20, background: "#f8f9fa", borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>Hitos Proyectados</div>
        {[
          { label: "RD$50K protegidos", meta: 50_000, actual: liquidezProtegida },
          { label: "RD$100K protegidos", meta: 100_000, actual: liquidezProtegida },
          { label: "RD$250K patrimonio", meta: 250_000, actual: Math.max(0, patrimonioNeto) },
          { label: "RD$1M patrimonio", meta: 1_000_000, actual: Math.max(0, patrimonioNeto) },
        ].map((h) => {
          const completado = h.actual >= h.meta;
          const faltante = Math.max(0, h.meta - h.actual);
          return (
            <div key={h.label} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 10,
              marginBottom: 10,
              borderBottom: "1px solid #e9ecef",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>{completado ? "✅" : "⏳"}</span>
                <span style={{ fontSize: 13, color: completado ? "#27ae60" : "#1a1a2e", fontWeight: completado ? 700 : 400 }}>
                  {h.label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: completado ? "#27ae60" : "#aaa", fontWeight: 600 }}>
                {completado ? "¡Completado!" : `Falta ${fmt(faltante)}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetaCard({ label, actual, meta, progreso, descripcion, color, icon }: {
  label: string; actual: number; meta?: number; progreso: number; descripcion?: string; color: string; icon: string;
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      padding: "16px",
      marginBottom: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      border: "1px solid #f0f0f0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{label}</span>
          </div>
          {descripcion && <div style={{ fontSize: 11, color: "#aaa", marginLeft: 24 }}>{descripcion}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>
            {new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(actual)}
          </div>
          {meta && (
            <div style={{ fontSize: 11, color: "#aaa" }}>
              de {new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(meta)}
            </div>
          )}
        </div>
      </div>

      {meta && (
        <>
          <div style={{ background: "#f0f0f0", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 4 }}>
            <div style={{
              width: `${progreso}%`,
              height: "100%",
              background: color,
              borderRadius: 6,
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#aaa" }}>
              {progreso >= 100 ? "¡Meta alcanzada!" : `Falta ${fmt(meta - actual)}`}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color }}>
              {progreso.toFixed(1)}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#1a1a2e",
  margin: "0 0 16px",
  letterSpacing: -0.5,
};
