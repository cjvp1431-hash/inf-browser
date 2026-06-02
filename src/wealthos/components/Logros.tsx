import React from "react";
import { useStore } from "../store";
import { calcularPatrimonioNeto, calcularLiquidezProtegida } from "../engine";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

export default function Logros() {
  const { state, dispatch } = useStore();
  const patrimonioNeto = calcularPatrimonioNeto(state.cuentas, state.deudas);
  const liquidezProtegida = calcularLiquidezProtegida(state.cuentas);

  const logrosConEstado = state.logros.map((l) => {
    let valorActual = 0;
    if (l.tipo === "patrimonio") valorActual = Math.max(0, patrimonioNeto);
    if (l.tipo === "liquidez") valorActual = liquidezProtegida;
    if (l.tipo === "deuda") {
      const tarjeta = state.deudas.find((d) => d.nombre.toLowerCase().includes("banreservas"));
      valorActual = tarjeta ? Math.max(0, 100 - (tarjeta.balance / 170_000) * 100) : 0;
    }
    const desbloqueado = valorActual >= l.umbral;
    if (desbloqueado && !l.completado) {
      dispatch({ type: "COMPLETE_LOGRO", id: l.id });
    }
    return { ...l, valorActual, desbloqueado };
  });

  const completados = logrosConEstado.filter((l) => l.completado || l.desbloqueado);
  const pendientes = logrosConEstado.filter((l) => !l.completado && !l.desbloqueado);

  return (
    <div style={{ padding: "20px 16px" }}>
      <h2 style={titleStyle}>Logros</h2>

      {/* Stats */}
      <div style={{
        background: "linear-gradient(135deg, #0a0a1a, #1a1a3e)",
        borderRadius: 16,
        padding: "16px 20px",
        marginBottom: 20,
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Logros desbloqueados</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{completados.length} / {state.logros.length}</div>
        </div>
        <div style={{ fontSize: 40 }}>🏆</div>
      </div>

      {completados.length > 0 && (
        <>
          <SectionTitle label="✅ Desbloqueados" />
          {completados.map((l) => (
            <LogroCard key={l.id} logro={l} completado />
          ))}
        </>
      )}

      <SectionTitle label="🔒 Por desbloquear" />
      {pendientes.map((l) => (
        <LogroCard key={l.id} logro={l} completado={false} />
      ))}

      {/* Recompensas */}
      <SectionTitle label="🎁 Recompensas" />
      {state.recompensas.map((r) => {
        const nivelActual = calcularNivel(liquidezProtegida);
        const disponible = nivelActual >= r.nivel;
        return (
          <div key={r.id} style={{
            background: "#fff",
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            border: `1px solid ${r.reclamada ? "#e9ecef" : disponible ? "#ffd70033" : "#f0f0f0"}`,
            opacity: r.reclamada ? 0.5 : 1,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>{r.nombre}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{r.descripcion}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Nivel {r.nivel} requerido</div>
              </div>
              <div>
                {r.reclamada ? (
                  <span style={{ fontSize: 20 }}>✅</span>
                ) : disponible ? (
                  <button
                    onClick={() => dispatch({ type: "RECLAMAR_RECOMPENSA", id: r.id })}
                    style={{
                      background: "linear-gradient(135deg, #f6d365, #fda085)",
                      border: "none",
                      borderRadius: 10,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      color: "#fff",
                    }}
                  >
                    ¡Reclamar!
                  </button>
                ) : (
                  <span style={{ fontSize: 20 }}>🔒</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function calcularNivel(liquidez: number): number {
  if (liquidez >= 10_000_000) return 7;
  if (liquidez >= 5_000_000) return 6;
  if (liquidez >= 1_000_000) return 5;
  if (liquidez >= 250_000) return 4;
  if (liquidez >= 100_000) return 3;
  if (liquidez >= 50_000) return 2;
  return 1;
}

function LogroCard({ logro, completado }: { logro: any; completado: boolean }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      border: `1px solid ${completado ? "#e8f5e9" : "#f0f0f0"}`,
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: completado ? "#27ae60" : "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        flexShrink: 0,
      }}>
        {completado ? "✓" : "○"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: completado ? "#27ae60" : "#1a1a2e", marginBottom: 2 }}>
          {logro.titulo}
        </div>
        <div style={{ fontSize: 12, color: "#aaa" }}>{logro.descripcion}</div>
        {logro.fechaCompletado && (
          <div style={{ fontSize: 11, color: "#27ae60", marginTop: 2 }}>
            {new Date(logro.fechaCompletado).toLocaleDateString("es-DO")}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, margin: "16px 0 10px" }}>
      {label}
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
