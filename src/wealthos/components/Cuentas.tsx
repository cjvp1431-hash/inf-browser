import React, { useState } from "react";
import { useStore } from "../store";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

const BANCO_COLORS: Record<string, string> = {
  Banreservas: "#003087",
  Qik: "#00b894",
  "Banco Popular": "#e74c3c",
};

const TIPO_ICONS: Record<string, string> = {
  operativa: "💳",
  puente: "🌉",
  meta: "🎯",
  inversion: "📈",
  efectivo: "💵",
};

export default function Cuentas() {
  const { state, dispatch } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState("");

  const totalActivos = state.cuentas.reduce((s, c) => s + c.balance, 0);

  function saveBalance(id: string) {
    const val = parseFloat(newBalance);
    if (!isNaN(val) && val >= 0) {
      dispatch({ type: "UPDATE_CUENTA", id, balance: val });
    }
    setEditingId(null);
    setNewBalance("");
  }

  const bancos = [...new Set(state.cuentas.map((c) => c.banco))];

  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={titleStyle}>Cuentas Bancarias</h2>

      <div style={{
        background: "linear-gradient(135deg, #0a0a1a, #1a1a3e)",
        borderRadius: 16,
        padding: "16px 20px",
        marginBottom: 20,
        color: "#fff",
      }}>
        <div style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1 }}>Total Activos</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>{fmt(totalActivos)}</div>
      </div>

      {bancos.map((banco) => (
        <div key={banco} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: BANCO_COLORS[banco] ?? "#999" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {banco}
            </span>
          </div>

          {state.cuentas
            .filter((c) => c.banco === banco)
            .map((cuenta) => (
              <div
                key={cuenta.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "14px 16px",
                  marginBottom: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: "1px solid #f0f0f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 16 }}>{TIPO_ICONS[cuenta.tipo] ?? "🏦"}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{cuenta.nombre}</span>
                    </div>
                    {cuenta.descripcion && (
                      <div style={{ fontSize: 11, color: "#aaa", marginLeft: 22 }}>{cuenta.descripcion}</div>
                    )}
                  </div>

                  {editingId === cuenta.id ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input
                        type="number"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        style={{
                          width: 110,
                          padding: "7px 10px",
                          borderRadius: 8,
                          border: "1.5px solid #1a1a2e",
                          fontSize: 13,
                          fontFamily: "inherit",
                          outline: "none",
                        }}
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && saveBalance(cuenta.id)}
                      />
                      <button onClick={() => saveBalance(cuenta.id)} style={smallBtn("#27ae60")}>✓</button>
                      <button onClick={() => setEditingId(null)} style={smallBtn("#e74c3c")}>✕</button>
                    </div>
                  ) : (
                    <div
                      style={{ textAlign: "right", cursor: "pointer" }}
                      onClick={() => { setEditingId(cuenta.id); setNewBalance(cuenta.balance.toString()); }}
                    >
                      <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a2e" }}>{fmt(cuenta.balance)}</div>
                      <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>toca para editar</div>
                    </div>
                  )}
                </div>

                {cuenta.meta && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "#aaa" }}>Meta: {fmt(cuenta.meta)}</span>
                      <span style={{ fontSize: 11, color: "#27ae60", fontWeight: 600 }}>
                        {Math.min(100, (cuenta.balance / cuenta.meta) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(100, (cuenta.balance / cuenta.meta) * 100)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #00b894, #00cec9)",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

const smallBtn = (bg: string): React.CSSProperties => ({
  background: bg,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  width: 32,
  height: 32,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
});

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#1a1a2e",
  margin: "0 0 16px",
  letterSpacing: -0.5,
};
