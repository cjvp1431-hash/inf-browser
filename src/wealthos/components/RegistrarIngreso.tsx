import React, { useState } from "react";
import { useStore } from "../store";
import { determinarFase, generarDistribucion, sugerirEfectivo, generarMensajeAdvisor } from "../engine";
import type { Ingreso, Distribucion } from "../types";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

export default function RegistrarIngreso({ onDistribucion }: { onDistribucion: (d: Distribucion[]) => void }) {
  const { state, dispatch } = useStore();
  const [monto, setMonto] = useState("");
  const [tipo, setTipo] = useState<Ingreso["tipo"]>("transferencia");
  const [origen, setOrigen] = useState<Ingreso["origen"]>("honorarios");
  const [esExtraordinario, setEsExtraordinario] = useState(false);
  const [hayCompromisos, setHayCompromisos] = useState(false);
  const [notas, setNotas] = useState("");
  const [efectivoInfo, setEfectivoInfo] = useState<ReturnType<typeof sugerirEfectivo> | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const fase = determinarFase(state.cuentas, state.deudas);
  const montoNum = parseFloat(monto.replace(/,/g, "")) || 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (montoNum <= 0) return;

    const ingreso: Ingreso = {
      id: Date.now().toString(),
      monto: montoNum,
      fecha: new Date().toISOString(),
      tipo,
      origen,
      esExtraordinario,
      hayCompromisos,
      notas,
    };

    dispatch({ type: "ADD_INGRESO", ingreso });

    if (tipo === "efectivo") {
      setEfectivoInfo(sugerirEfectivo(montoNum));
    }

    const distribucion = generarDistribucion(montoNum, fase, esExtraordinario, hayCompromisos);
    onDistribucion(distribucion);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ padding: "20px 16px" }}>
        <div style={{
          background: "linear-gradient(135deg, #0a0a1a, #1a1a3e)",
          borderRadius: 20,
          padding: "24px",
          color: "#fff",
          textAlign: "center",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Ingreso Registrado</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>{fmt(montoNum)}</div>
          <div style={{ fontSize: 13, opacity: 0.6, marginTop: 6 }}>
            {tipo === "transferencia" ? "Transferencia" : tipo === "efectivo" ? "Efectivo" : "Otro"} –{" "}
            {origen}
          </div>
        </div>

        {tipo === "efectivo" && efectivoInfo && (
          <div style={{
            background: "#fff8e1",
            border: "1px solid #ffc10722",
            borderRadius: 16,
            padding: "16px",
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f57c00", marginBottom: 12 }}>
              💵 Sugerencia para efectivo
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, background: "#fff3e0", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>DEPOSITAR</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#e65100" }}>{fmt(efectivoInfo.depositar)}</div>
              </div>
              <div style={{ flex: 1, background: "#e8f5e9", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>CONSERVAR</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2e7d32" }}>{fmt(efectivoInfo.conservar)}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 8 }}>{efectivoInfo.razon}</div>
          </div>
        )}

        <div style={{
          background: "#f0f4ff",
          borderRadius: 14,
          padding: "14px",
          marginBottom: 16,
          borderLeft: "3px solid #5c6bc0",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5c6bc0", marginBottom: 4 }}>ADVISOR IA</div>
          <div style={{ fontSize: 13, color: "#1a1a2e", lineHeight: 1.5, fontStyle: "italic" }}>
            "{generarMensajeAdvisor(state, "ingreso")}"
          </div>
        </div>

        <button
          onClick={() => {
            setMonto(""); setTipo("transferencia"); setOrigen("honorarios");
            setEsExtraordinario(false); setHayCompromisos(false); setNotas("");
            setEfectivoInfo(null); setSubmitted(false);
          }}
          style={btnStyle(false)}
        >
          Registrar otro ingreso
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={titleStyle}>Registrar Ingreso</h2>

      <div style={{
        background: "#f0f4ff",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 20,
        borderLeft: "3px solid #5c6bc0",
      }}>
        <span style={{ fontSize: 12, color: "#5c6bc0", fontWeight: 600 }}>Fase activa: </span>
        <span style={{ fontSize: 12, color: "#1a1a2e" }}>
          {fase === 1 ? "Recuperación" : fase === 2 ? "Estabilidad" : "Acumulación"}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <Field label="Monto (RD$)">
          <input
            type="number"
            placeholder="Ej: 150000"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            style={inputStyle}
            required
            min="1"
          />
        </Field>

        <Field label="Tipo de ingreso">
          <div style={{ display: "flex", gap: 8 }}>
            {(["transferencia", "efectivo", "otro"] as const).map((t) => (
              <Chip key={t} label={t === "transferencia" ? "Transferencia" : t === "efectivo" ? "Efectivo" : "Otro"}
                active={tipo === t} onClick={() => setTipo(t)} />
            ))}
          </div>
        </Field>

        <Field label="Origen">
          <select value={origen} onChange={(e) => setOrigen(e.target.value as Ingreso["origen"])} style={inputStyle}>
            <option value="honorarios">Honorarios profesionales</option>
            <option value="variable">Ingreso variable</option>
            <option value="extraordinario">Extraordinario</option>
            <option value="regalo">Regalo / bono</option>
            <option value="otro">Otro</option>
          </select>
        </Field>

        <Field label="">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Toggle label="¿Es ingreso extraordinario?" value={esExtraordinario} onChange={setEsExtraordinario} />
            <Toggle label="¿Hay compromisos urgentes?" value={hayCompromisos} onChange={setHayCompromisos} />
          </div>
        </Field>

        {esExtraordinario && !hayCompromisos && (
          <div style={{ background: "#e8f5e9", borderRadius: 12, padding: "12px 14px", marginBottom: 16, borderLeft: "3px solid #27ae60" }}>
            <div style={{ fontSize: 12, color: "#27ae60", fontWeight: 600 }}>
              Tasa extraordinaria: hasta 40% para patrimonio
            </div>
          </div>
        )}

        <Field label="Notas (opcional)">
          <input
            type="text"
            placeholder="Ej: Pago por proyecto XYZ"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {montoNum > 0 && (
          <div style={{ background: "#f8f9fa", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Vista previa</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e" }}>{fmt(montoNum)}</div>
            <div style={{ fontSize: 12, color: "#27ae60", marginTop: 2 }}>
              Patrimonio/metas estimado: {fmt(montoNum * (esExtraordinario && !hayCompromisos ? 0.4 : 0.3))}
            </div>
          </div>
        )}

        <button type="submit" style={btnStyle(true)}>
          Registrar y ver distribución →
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>}
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 6px",
        borderRadius: 10,
        border: active ? "2px solid #1a1a2e" : "2px solid #e9ecef",
        background: active ? "#1a1a2e" : "#fff",
        color: active ? "#fff" : "#666",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8f9fa", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}
      onClick={() => onChange(!value)}
    >
      <span style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 500 }}>{label}</span>
      <div style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? "#1a1a2e" : "#ddd",
        position: "relative",
        transition: "background 0.2s",
      }}>
        <div style={{
          position: "absolute",
          top: 2, left: value ? 22 : 2,
          width: 20, height: 20,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </div>
    </div>
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

const btnStyle = (primary: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "16px",
  borderRadius: 14,
  border: "none",
  background: primary ? "linear-gradient(135deg, #0a0a1a, #1a1a3e)" : "#f8f9fa",
  color: primary ? "#fff" : "#1a1a2e",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 4,
});
