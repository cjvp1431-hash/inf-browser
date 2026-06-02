import React, { useState } from "react";
import { useStore } from "../store";
import { determinarFaseV2, generarDistribucion } from "../engine";
import type { Distribucion } from "../types";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

// Mapping: keywords in destino → cuenta IDs
const DESTINO_MAP: Record<string, string> = {
  "Qik Patrimonio":       "qik-patrimonio",
  "Qik Emergencia":       "qik-emergencia",
  "Qik Disfrute":         "qik-disfrute",
  "Qik Vehículo":         "qik-vehiculo",
  "Qik Inmueble Futuro":  "qik-inmueble",
  "Banreservas Principal":"banres-principal",
  "Banreservas Secundaria":"banres-secundaria",
};

function resolverCuentaId(destino: string | undefined): string | null {
  if (!destino) return null;
  for (const [key, id] of Object.entries(DESTINO_MAP)) {
    if (destino.includes(key)) return id;
  }
  return null;
}

interface EjecucionItem {
  distribucion: Distribucion;
  cuentaId: string | null;
  checked: boolean;
  // For "Estabilidad/Patrimonio" (Fase 1, 70/30 split)
  split?: { emergencia: number; patrimonio: number };
}

export default function DistribucionSugerida({ distribucion: distProp }: { distribucion?: Distribucion[] }) {
  const { state, dispatch } = useStore();
  const [monto, setMonto] = useState("");
  const [esExtraordinario, setEsExtraordinario] = useState(false);
  const [hayCompromisos, setHayCompromisos] = useState(false);
  const [resultado, setResultado] = useState<Distribucion[] | null>(distProp ?? null);
  const [showEjecutar, setShowEjecutar] = useState(false);
  const [ejecucionItems, setEjecucionItems] = useState<EjecucionItem[]>([]);
  const [ejecutado, setEjecutado] = useState(false);

  const fase = determinarFaseV2(state);
  const montoNum = parseFloat(monto.replace(/,/g, "")) || 0;

  function calcular() {
    if (montoNum <= 0) return;
    setResultado(generarDistribucion(montoNum, fase, esExtraordinario, hayCompromisos));
    setEjecutado(false);
  }

  function prepararEjecucion() {
    if (!resultado) return;
    const items: EjecucionItem[] = [];
    for (const d of resultado) {
      if (d.destino?.includes("Emergencia+Patrimonio")) {
        // Fase 1: split 70/30
        items.push({
          distribucion: { ...d, categoria: "Fondo Emergencia (70%)", monto: d.monto * 0.7, destino: "Qik Emergencia" },
          cuentaId: "qik-emergencia", checked: true,
          split: { emergencia: d.monto * 0.7, patrimonio: d.monto * 0.3 },
        });
        items.push({
          distribucion: { ...d, categoria: "Patrimonio (30%)", monto: d.monto * 0.3, destino: "Qik Patrimonio" },
          cuentaId: "qik-patrimonio", checked: true,
        });
      } else {
        items.push({ distribucion: d, cuentaId: resolverCuentaId(d.destino), checked: true });
      }
    }
    setEjecucionItems(items);
    setShowEjecutar(true);
  }

  function confirmarEjecucion() {
    const updates = ejecucionItems
      .filter((item) => item.checked && item.cuentaId)
      .map((item) => ({ cuentaId: item.cuentaId!, monto: item.distribucion.monto }));

    if (updates.length > 0) {
      dispatch({ type: "EJECUTAR_DISTRIBUCION", items: updates });
    }
    setShowEjecutar(false);
    setEjecutado(true);
  }

  // ─── Confirmación de ejecución ──────────────────────────────────────────
  if (showEjecutar) {
    return (
      <div style={{ padding: "20px 16px" }}>
        <h2 style={titleStyle}>Confirmar Ejecución</h2>
        <div style={{ background: "#f0f4ff", borderRadius: 12, padding: "12px 14px", marginBottom: 16, borderLeft: "3px solid #5c6bc0" }}>
          <div style={{ fontSize: 12, color: "#5c6bc0", fontWeight: 600 }}>
            Selecciona los destinos a actualizar. Los balances se incrementarán automáticamente.
          </div>
        </div>

        {ejecucionItems.map((item, i) => {
          const cuentaNombre = item.cuentaId
            ? (state.cuentas.find((c) => c.id === item.cuentaId)?.nombre ?? item.cuentaId)
            : (item.distribucion.destino ?? "Sin destino definido");
          const sinCuenta = !item.cuentaId;

          return (
            <div key={i} style={{
              background: item.checked ? "#fff" : "#fafafa",
              borderRadius: 14, padding: "14px 16px", marginBottom: 10,
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              border: `1px solid ${item.checked ? "#e0e8ff" : "#f0f0f0"}`,
              opacity: sinCuenta ? 0.7 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  onClick={() => !sinCuenta && setEjecucionItems((prev) => prev.map((x, j) => j === i ? { ...x, checked: !x.checked } : x))}
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: `2px solid ${item.checked ? "#5c6bc0" : "#ddd"}`,
                    background: item.checked ? "#5c6bc0" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: sinCuenta ? "not-allowed" : "pointer", flexShrink: 0,
                  }}
                >
                  {item.checked && <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{item.distribucion.categoria}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                    → {cuentaNombre}
                    {sinCuenta && <span style={{ color: "#f39c12" }}> (manual)</span>}
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.checked ? "#1a1a2e" : "#bbb" }}>
                  {fmt(item.distribucion.monto)}
                </div>
              </div>
            </div>
          );
        })}

        <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>Total a actualizar</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#5c6bc0" }}>
            {fmt(ejecucionItems.filter((x) => x.checked && x.cuentaId).reduce((s, x) => s + x.distribucion.monto, 0))}
          </span>
        </div>

        <button onClick={confirmarEjecucion} style={btnPrimary}>✓ Confirmar y actualizar balances</button>
        <button onClick={() => setShowEjecutar(false)} style={{ ...btnSecondary, marginTop: 8 }}>Cancelar</button>
      </div>
    );
  }

  // ─── Confirmación post-ejecución ────────────────────────────────────────
  if (ejecutado) {
    return (
      <div style={{ padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>Distribución ejecutada</div>
        <div style={{ fontSize: 14, color: "#888", marginBottom: 20 }}>Los balances de tus cuentas han sido actualizados.</div>
        <button onClick={() => { setEjecutado(false); setResultado(null); setMonto(""); }} style={btnPrimary}>
          Nueva distribución
        </button>
      </div>
    );
  }

  // ─── Vista principal ────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={titleStyle}>Distribución Sugerida</h2>

      <div style={{ background: "#f8f9fa", borderRadius: 16, padding: "16px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Simular distribución
        </div>
        <input
          type="number" placeholder="Monto (RD$)" value={monto}
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>
              {fmt(resultado.reduce((s, d) => s + d.monto, 0))}
            </div>
            <div style={{
              background: fase === 1 ? "#fdf0ef" : fase === 2 ? "#fef9ef" : "#edfaf1",
              color: fase === 1 ? "#e74c3c" : fase === 2 ? "#f39c12" : "#27ae60",
              borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
            }}>
              Fase {fase} – {fase === 1 ? "Recuperación" : fase === 2 ? "Estabilidad" : "Acumulación"}
            </div>
          </div>

          {/* Visual bar */}
          <div style={{ display: "flex", height: 12, borderRadius: 8, overflow: "hidden", marginBottom: 16, gap: 2 }}>
            {resultado.map((d) => (
              <div key={d.categoria} style={{ flex: d.porcentaje, background: d.color, transition: "flex 0.5s ease" }} title={`${d.categoria}: ${d.porcentaje}%`} />
            ))}
          </div>

          {resultado.map((d) => (
            <div key={d.categoria} style={{
              background: "#fff", borderRadius: 14, padding: "14px 16px", marginBottom: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ width: 4, height: 44, borderRadius: 4, background: d.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>{d.categoria}</div>
                {d.destino && <div style={{ fontSize: 11, color: "#999" }}>→ {d.destino}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{fmt(d.monto)}</div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{d.porcentaje}%</div>
              </div>
            </div>
          ))}

          {/* Botón ejecutar */}
          <button onClick={prepararEjecucion} style={{ ...btnPrimary, marginTop: 4 }}>
            ✓ Marcar como ejecutado
          </button>

          <div style={{ background: "#f0f4ff", borderRadius: 14, padding: "14px", marginTop: 10, borderLeft: "3px solid #5c6bc0" }}>
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
          <div style={{ fontSize: 14, color: "#aaa" }}>Ingresa un monto para ver la distribución recomendada</div>
        </div>
      )}
    </div>
  );
}

function ToggleMini({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      flex: 1, padding: "9px 8px", borderRadius: 10,
      border: value ? "2px solid #1a1a2e" : "2px solid #e9ecef",
      background: value ? "#1a1a2e" : "#fff", color: value ? "#fff" : "#666",
      fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    }}>
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 14px", borderRadius: 12, border: "1.5px solid #e9ecef",
  fontSize: 15, color: "#1a1a2e", background: "#fff", boxSizing: "border-box",
  outline: "none", fontFamily: "inherit", display: "block",
};

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "14px", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg, #0a0a1a, #1a1a3e)", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

const btnSecondary: React.CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 12, border: "none",
  background: "#f0f0f0", color: "#666", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
};

const titleStyle: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: "0 0 16px", letterSpacing: -0.5 };
