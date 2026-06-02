import React, { useState } from "react";
import { useStore } from "../store";
import type { Deuda } from "../types";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

const PRIORIDAD_COLOR = { alta: "#e74c3c", media: "#f39c12", baja: "#27ae60" };

export default function Deudas() {
  const { state, dispatch } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<Deuda>>({ prioridad: "media" });

  const totalDeudas = state.deudas.reduce((s, d) => s + d.balance, 0);
  const totalMensual = state.deudas.reduce((s, d) => s + d.pagoMensual, 0);

  function saveBalance(id: string) {
    const val = parseFloat(newBalance);
    if (!isNaN(val) && val >= 0) dispatch({ type: "UPDATE_DEUDA", id, balance: val });
    setEditingId(null);
    setNewBalance("");
  }

  function addDeuda() {
    if (!form.nombre || !form.balance || !form.pagoMensual) return;
    const deuda: Deuda = {
      id: Date.now().toString(),
      nombre: form.nombre,
      balance: Number(form.balance),
      pagoMensual: Number(form.pagoMensual),
      tasa: form.tasa ? Number(form.tasa) : undefined,
      prioridad: form.prioridad ?? "media",
    };
    // Add via a workaround using load with updated state
    const newState = { ...state, deudas: [...state.deudas, deuda] };
    dispatch({ type: "LOAD", state: newState });
    setForm({ prioridad: "media" });
    setShowAdd(false);
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ ...titleStyle, margin: 0 }}>Deudas</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: "#f8f9fa",
            border: "none",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            color: "#1a1a2e",
          }}
        >
          + Agregar
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div style={summaryCard}>
          <div style={{ fontSize: 11, color: "#e74c3c", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Total Deudas</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#e74c3c" }}>{fmt(totalDeudas)}</div>
        </div>
        <div style={summaryCard}>
          <div style={{ fontSize: 11, color: "#888", fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Pago Mensual</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1a2e" }}>{fmt(totalMensual)}</div>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: "#f8f9fa", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e", marginBottom: 12 }}>Nueva Deuda</div>
          <input placeholder="Nombre" value={form.nombre ?? ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Balance actual (RD$)" type="number" value={form.balance ?? ""} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Pago mensual (RD$)" type="number" value={form.pagoMensual ?? ""} onChange={(e) => setForm({ ...form, pagoMensual: Number(e.target.value) })} style={{ ...inputStyle, marginBottom: 8 }} />
          <input placeholder="Tasa % (opcional)" type="number" value={form.tasa ?? ""} onChange={(e) => setForm({ ...form, tasa: Number(e.target.value) })} style={{ ...inputStyle, marginBottom: 8 }} />
          <select value={form.prioridad ?? "media"} onChange={(e) => setForm({ ...form, prioridad: e.target.value as Deuda["prioridad"] })} style={{ ...inputStyle, marginBottom: 12 }}>
            <option value="alta">Alta prioridad</option>
            <option value="media">Media prioridad</option>
            <option value="baja">Baja prioridad</option>
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addDeuda} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#1a1a2e", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Guardar</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#e9ecef", color: "#666", fontSize: 13, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Debt cards */}
      {state.deudas.map((deuda) => {
        const mesesRestantes = deuda.pagoMensual > 0 ? Math.ceil(deuda.balance / deuda.pagoMensual) : null;
        return (
          <div key={deuda.id} style={{
            background: "#fff",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: "1px solid #f0f0f0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: PRIORIDAD_COLOR[deuda.prioridad],
                  }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{deuda.nombre}</span>
                </div>
                <div style={{ fontSize: 11, color: "#aaa", marginLeft: 16 }}>
                  {fmt(deuda.pagoMensual)}/mes{deuda.tasa ? ` · ${deuda.tasa}% anual` : ""}
                  {mesesRestantes ? ` · ~${mesesRestantes} meses` : ""}
                </div>
              </div>

              {editingId === deuda.id ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    style={{ width: 110, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #1a1a2e", fontSize: 13, fontFamily: "inherit", outline: "none" }}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveBalance(deuda.id)}
                  />
                  <button onClick={() => saveBalance(deuda.id)} style={{ ...smallBtn, background: "#27ae60" }}>✓</button>
                  <button onClick={() => setEditingId(null)} style={{ ...smallBtn, background: "#e74c3c" }}>✕</button>
                </div>
              ) : (
                <div
                  style={{ textAlign: "right", cursor: "pointer" }}
                  onClick={() => { setEditingId(deuda.id); setNewBalance(deuda.balance.toString()); }}
                >
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#e74c3c" }}>{fmt(deuda.balance)}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 2 }}>toca para editar</div>
                </div>
              )}
            </div>

            {/* Mini progress bar showing payoff */}
            <div style={{ background: "#f0f0f0", borderRadius: 4, height: 5, overflow: "hidden" }}>
              <div style={{
                width: `${Math.max(5, 100 - Math.min(100, (deuda.balance / (deuda.balance + deuda.pagoMensual * 12)) * 100))}%`,
                height: "100%",
                background: PRIORIDAD_COLOR[deuda.prioridad],
                transition: "width 0.5s",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const summaryCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: 14,
  padding: "14px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  border: "1px solid #f0f0f0",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1.5px solid #e9ecef",
  fontSize: 14,
  color: "#1a1a2e",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
  fontFamily: "inherit",
  display: "block",
};

const smallBtn: React.CSSProperties = {
  color: "#fff",
  border: "none",
  borderRadius: 8,
  width: 32,
  height: 32,
  fontSize: 14,
  cursor: "pointer",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: "#1a1a2e",
  letterSpacing: -0.5,
};
