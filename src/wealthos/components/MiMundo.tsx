import React from "react";
import { useStore } from "../store";
import {
  calcularUtilizacionTarjeta, calcularProgreso,
  diasHastaFecha, costoAnualEstimado, clasificarTasa, TASA_COLORS,
} from "../engine";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

const pct = (n: number) => `${n.toFixed(0)}%`;

export default function MiMundo() {
  const { state } = useStore();

  const efectivoTotal = state.cuentas.reduce((s, c) => s + c.balance, 0);
  const totalTarjetas = (state.tarjetas ?? []).filter(t => t.activa).reduce((s, t) => s + t.balanceActualDOP, 0);
  const totalPrestamos = (state.prestamos ?? []).filter(p => p.activo).reduce((s, p) => s + p.balancePendiente, 0);
  const totalInversiones = (state.inversiones ?? []).reduce((s, i) => s + i.balanceActual, 0);

  return (
    <div style={{ padding: "4px 16px 24px" }}>

      {/* ─── Resumen top ─────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <MiniStat label="Activos"     value={fmt(efectivoTotal + totalInversiones)} color="#27ae60" />
        <MiniStat label="Pasivos"     value={fmt(totalTarjetas + totalPrestamos)}   color="#e74c3c" />
      </div>

      {/* ─── Cuentas bancarias ───────────────────────────────── */}
      <SectionHeader label="Cuentas" icon="🏦" />
      {state.cuentas.map((c) => (
        <div key={c.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{c.nombre}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{c.descripcion ?? c.tipo}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{fmt(c.balance)}</div>
              {c.meta && (
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                  {pct(calcularProgreso(c.balance, c.meta))} de meta
                </div>
              )}
            </div>
          </div>
          {c.meta && (
            <div style={{ marginTop: 8, background: "#f0f0f0", borderRadius: 4, height: 5, overflow: "hidden" }}>
              <div style={{ width: `${calcularProgreso(c.balance, c.meta)}%`, height: "100%", background: "#00b894", transition: "width 0.5s" }} />
            </div>
          )}
        </div>
      ))}

      {/* ─── Tarjetas de crédito ─────────────────────────────── */}
      <SectionHeader label="Tarjetas de Crédito" icon="💳" />
      {(state.tarjetas ?? []).filter(t => t.activa).length === 0 && (
        <EmptyState label="Sin tarjetas registradas" action="Agregar en Productos" />
      )}
      {(state.tarjetas ?? []).filter(t => t.activa).map((t) => {
        const util = calcularUtilizacionTarjeta(t);
        const utilColor = util >= 80 ? "#e74c3c" : util >= 50 ? "#f39c12" : "#27ae60";
        const diasCorte = diasHastaFecha(t.diaCorte);
        const diasPago  = diasHastaFecha(t.diaLimitePago);
        const costoAnual = costoAnualEstimado(t.balanceActualDOP, t.tasaAnual);
        const clsTasa = clasificarTasa(t.tasaAnual);

        return (
          <div key={t.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{t.nombre}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{t.banco}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e74c3c" }}>{fmt(t.balanceActualDOP)}</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>de {fmt(t.limiteDOP)}</div>
              </div>
            </div>

            {/* Utilización bar */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#888" }}>Utilización</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: utilColor }}>{pct(util)}</span>
              </div>
              <div style={{ background: "#f0f0f0", borderRadius: 4, height: 7, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, util)}%`, height: "100%", background: utilColor, transition: "width 0.5s" }} />
              </div>
            </div>

            {/* Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {t.tasaAnual > 0 && (
                <Pill label={`${t.tasaAnual}% anual`} color={TASA_COLORS[clsTasa]} />
              )}
              {t.diaCorte > 0 && (
                <Pill label={`Corte en ${diasCorte}d`} color="#888" />
              )}
              {t.diaLimitePago > 0 && (
                <Pill label={`Pago en ${diasPago}d`} color={diasPago <= 5 ? "#e74c3c" : "#888"} />
              )}
              {costoAnual > 0 && (
                <Pill label={`Costo anual ~${fmt(costoAnual)}`} color="#e74c3c" />
              )}
            </div>

            {/* Alerts */}
            {util >= 80 && <AlertLine text="⚠️ Utilización crítica — reducir urgente" />}
            {t.tasaAnual > 40 && <AlertLine text={`⚠️ Tasa ${t.tasaAnual}% — deuda muy costosa`} />}
            {diasPago <= 5 && diasPago >= 0 && <AlertLine text={`⏰ Pago en ${diasPago} días`} color="#f39c12" />}
          </div>
        );
      })}

      {/* ─── Préstamos ────────────────────────────────────────── */}
      <SectionHeader label="Préstamos" icon="🏛️" />
      {(state.prestamos ?? []).filter(p => p.activo).length === 0 && (
        <EmptyState label="Sin préstamos registrados" action="Agregar en Productos" />
      )}
      {(state.prestamos ?? []).filter(p => p.activo).map((p) => {
        const amortizado = p.montoOriginal > 0 ? calcularProgreso(p.montoOriginal - p.balancePendiente, p.montoOriginal) : 0;
        const mesesRestantes = p.cuotaMensual > 0 ? Math.ceil(p.balancePendiente / p.cuotaMensual) : null;
        const costoAnual = costoAnualEstimado(p.balancePendiente, p.tasaAnual);
        const clsTasa = clasificarTasa(p.tasaAnual);

        return (
          <div key={p.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{p.banco} · Cuota {fmt(p.cuotaMensual)}/mes</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e74c3c" }}>{fmt(p.balancePendiente)}</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>pendiente</div>
              </div>
            </div>

            {/* Amortización */}
            {p.montoOriginal > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#888" }}>Amortizado</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#27ae60" }}>{pct(amortizado)}</span>
                </div>
                <div style={{ background: "#f0f0f0", borderRadius: 4, height: 7, overflow: "hidden" }}>
                  <div style={{ width: `${amortizado}%`, height: "100%", background: "#27ae60", transition: "width 0.5s" }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {p.tasaAnual > 0 && <Pill label={`${p.tasaAnual}% anual`} color={TASA_COLORS[clsTasa]} />}
              {mesesRestantes && <Pill label={`~${mesesRestantes} meses`} color="#888" />}
              {costoAnual > 0 && <Pill label={`Interés anual ~${fmt(costoAnual)}`} color="#e74c3c" />}
            </div>
          </div>
        );
      })}

      {/* ─── Inversiones ─────────────────────────────────────── */}
      <SectionHeader label="Inversiones" icon="📈" />
      {(state.inversiones ?? []).length === 0 && (
        <EmptyState label="Sin inversiones registradas" action="Agregar en Productos" />
      )}
      {(state.inversiones ?? []).map((inv) => (
        <div key={inv.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{inv.nombre}</div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>{inv.tipo}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#27ae60" }}>{fmt(inv.balanceActual)}</div>
              {inv.rendimientoEsperadoAnual > 0 && (
                <div style={{ fontSize: 10, color: "#27ae60" }}>+{inv.rendimientoEsperadoAnual}% est.</div>
              )}
            </div>
          </div>
          {inv.aporteMensual > 0 && (
            <div style={{ marginTop: 8 }}>
              <Pill label={`Aporte ${fmt(inv.aporteMensual)}/mes`} color="#5c6bc0" />
            </div>
          )}
        </div>
      ))}

      {/* ─── Metas de ahorro ─────────────────────────────────── */}
      {(state.metasAhorro ?? []).length > 0 && (
        <>
          <SectionHeader label="Metas de Ahorro" icon="🎯" />
          {state.metasAhorro.filter(m => m.activa).map((m) => {
            const prog = calcularProgreso(m.balanceActual, m.metaObjetivo);
            return (
              <div key={m.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{m.nombre}</div>
                    {m.fechaObjetivo && (
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
                        Objetivo: {new Date(m.fechaObjetivo).toLocaleDateString("es-DO", { month: "short", year: "numeric" })}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a2e" }}>{fmt(m.balanceActual)}</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>de {fmt(m.metaObjetivo)}</div>
                  </div>
                </div>
                <div style={{ background: "#f0f0f0", borderRadius: 4, height: 7, overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ width: `${prog}%`, height: "100%", background: "#5c6bc0", transition: "width 0.5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#aaa" }}>Falta {fmt(Math.max(0, m.metaObjetivo - m.balanceActual))}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#5c6bc0" }}>{pct(prog)}</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Deudas legacy (si existen) */}
      {state.deudas.length > 0 && (
        <>
          <SectionHeader label="Deudas (legacy)" icon="📋" />
          {state.deudas.map((d) => (
            <div key={d.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{d.nombre}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>Pago: {fmt(d.pagoMensual)}/mes</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#e74c3c" }}>{fmt(d.balance)}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function SectionHeader({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 10px" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
      <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 8px", borderRadius: 20,
      fontSize: 10, fontWeight: 600, color: "#fff",
      background: color, letterSpacing: 0.3,
    }}>
      {label}
    </span>
  );
}

function AlertLine({ text, color = "#e74c3c" }: { text: string; color?: string }) {
  return (
    <div style={{ marginTop: 8, fontSize: 11, color, fontWeight: 600, background: `${color}11`, borderRadius: 8, padding: "6px 10px" }}>
      {text}
    </div>
  );
}

function EmptyState({ label, action }: { label: string; action: string }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: 14, padding: "14px 16px", marginBottom: 8, textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "#aaa", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: "#bbb" }}>{action}</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 10,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0",
};
