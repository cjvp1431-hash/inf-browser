import React, { useState } from "react";
import { useStore } from "../store";
import { determinarFase, generarDistribucion } from "../engine";
import type { Distribucion } from "../types";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

export default function DistribucionSugerida({ distribucion: distProp }: { distribucion?: Distribucion[] }) {
  const { state } = useStore();
  const [monto, setMonto] = useState("");
  const [esExtraordinario, setEsExtraordinario] = useState(false);
  const [hayCompromisos, setHayCompromisos] = useState(false);
  const [resultado, setResultado] = useState<Distribucion[] | null>(distProp ?? null);

  const fase = determinarFase(state.cuentas, state.deudas);
  const montoNum = parseFloat(monto.replace(/,/g, "")) || 0;

  function calcular() {
    if (montoNum <= 0) return;
    setResultado(generarDistribucion(montoNum, fase, esExtraordinario, hayCompromisos));
  }

  const total = resultado?.reduce((s, d) => s + d.monto, 0) ?? 0;

  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={titleStyle}>Distribución Sugerida</h2>

      <div style={{
        background: "#f8f9fa",
        borderRadius: 16,
        padding: "16px",
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Simular distribución
        </div>
        <input
          type="number"
          placeholder="Monto (RD$)"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          style={{ ...inputStyle, marginBottom: 10 }}
        />
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <ToggleMini label="Extraordinario" value={esExtraordinario} onChange={setEsExtraordinario} />
          <ToggleMini label="Compromisos urgentes" value={hayCompromisos} onChange={setHayCompromisos} />
        </div>
        <button onClick={calcular} style={btnPrimary}>Calcular distribución</button>
      </div>

      {resultado && (
        <>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>
              {fmt(total)}
            </div>
            <div style={{
              background: fase === 1 ? "#fdf0ef" : fase === 2 ? "#fef9ef" : "#edfaf1",
              color: fase === 1 ? "#e74c3c" : fase === 2 ? "#f39c12" : "#27ae60",
              borderRadius: 20,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 700,
            }}>
              Fase {fase} – {fase === 1 ? "Recuperación" : fase === 2 ? "Estabilidad" : "Acumulación"}
            </div>
          </div>

          {/* Visual bar */}
          <div style={{ display: "flex", height: 12, borderRadius: 8, overflow: "hidden", marginBottom: 16, gap: 2 }}>
            {resultado.map((d) => (
              <div
                key={d.categoria}
                style={{ flex: d.porcentaje, background: d.color, transition: "flex 0.5s ease" }}
                title={`${d.categoria}: ${d.porcentaje}%`}
              />
            ))}
          </div>

          {/* Cards */}
          {resultado.map((d) => (
            <DistribucionCard key={d.categoria} item={d} total={total} />
          ))}

          <div style={{
            background: "#f0f4ff",
            borderRadius: 14,
            padding: "14px",
            marginTop: 8,
            borderLeft: "3px solid #5c6bc0",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#5c6bc0", marginBottom: 4 }}>PRÓXIMO PASO</div>
            <div style={{ fontSize: 13, color: "#1a1a2e" }}>
              Transfiere desde Banreservas Secundaria a cada destino dentro de las próximas 24 horas.
            </div>
          </div>
        </>
      )}

      {!resultado && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#ccc" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📐</div>
          <div style={{ fontSize: 14, color: "#aaa" }}>
            Ingresa un monto para ver la distribución recomendada
          </div>
        </div>
      )}
    </div>
  );
}

function DistribucionCard({ item, total }: { item: Distribucion; total: number }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      border: "1px solid #f0f0f0",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 4,
        height: 44,
        borderRadius: 4,
        background: item.color,
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>{item.categoria}</div>
        {item.destino && (
          <div style={{ fontSize: 11, color: "#999" }}>→ {item.destino}</div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>
          {new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(item.monto)}
        </div>
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{item.porcentaje}%</div>
      </div>
    </div>
  );
}

function ToggleMini({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        flex: 1,
        padding: "9px 8px",
        borderRadius: 10,
        border: value ? "2px solid #1a1a2e" : "2px solid #e9ecef",
        background: value ? "#1a1a2e" : "#fff",
        color: value ? "#fff" : "#666",
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 12,
  border: "1.5px solid #e9ecef",
  fontSize: 15,
  color: "#1a1a2e",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#1a1a2e",
  margin: "0 0 16px",
  letterSpacing: -0.5,
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #0a0a1a, #1a1a3e)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
