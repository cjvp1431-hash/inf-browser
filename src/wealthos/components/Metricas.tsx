import React from "react";
import { useStore } from "../store";
import { calcularMetricasMes, calcularHealthScore } from "../engine";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

export default function Metricas() {
  const { state } = useStore();
  const metricas = calcularMetricasMes(state);
  const health = calcularHealthScore(state);

  const ingresosMes = state.ingresos.filter((i) => {
    const f = new Date(i.fecha);
    const now = new Date();
    return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear();
  });

  const ingresosPorMes = agruparPorMes(state.ingresos);
  const mesesConDatos = Object.keys(ingresosPorMes).sort().slice(-6);

  const streaks = state.streaks ?? { ingresosAsignados24h: 0, diasActivos: 0, mesesAumentandoPatrimonio: 0, mesesCapturando30: 0 };

  return (
    <div style={{ padding: "4px 16px 24px" }}>
      <h2 style={titleStyle}>Métricas</h2>

      {/* ─── Ingresos del mes ─────────────────────────────────── */}
      <SectionLabel label="Ingresos" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <MetricCard label="Este mes" value={fmt(metricas.ingresosMes)} sub={`${metricas.cantidadIngresosMes} registros`} color="#1a1a2e" large />
        <MetricCard label="Prom. 3 meses" value={fmt(metricas.ingresosUlt3)} color="#5c6bc0" />
        <MetricCard label="Prom. 12 meses" value={fmt(metricas.ingresosUlt12)} color="#888" />
        <MetricCard label="Tasa captura" value={`${metricas.tasaCapturaMes.toFixed(0)}%`} color={metricas.tasaCapturaMes >= 30 ? "#27ae60" : "#f39c12"} sub="objetivo 30%" />
      </div>

      {/* ─── Historial últimos 6 meses ────────────────────────── */}
      {mesesConDatos.length > 0 && (
        <>
          <SectionLabel label="Últimos 6 meses" />
          <div style={{ background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
            {mesesConDatos.map((mesKey) => {
              const datos = ingresosPorMes[mesKey];
              const total = datos.reduce((s: number, i: any) => s + i.monto, 0);
              const maxTotal = Math.max(...mesesConDatos.map((k) => ingresosPorMes[k].reduce((s: number, i: any) => s + i.monto, 0)));
              const widthPct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
              const [year, month] = mesKey.split("-");
              const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("es-DO", { month: "short", year: "2-digit" });
              return (
                <div key={mesKey} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 40, fontSize: 11, color: "#888", flexShrink: 0 }}>{label}</div>
                  <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 24, overflow: "hidden" }}>
                    <div style={{ width: `${widthPct}%`, height: "100%", background: "linear-gradient(90deg, #1a1a2e, #5c6bc0)", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 8, minWidth: 60 }}>
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(total)}</span>
                    </div>
                  </div>
                  <div style={{ width: 20, fontSize: 11, color: "#888", flexShrink: 0 }}>{datos.length}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── Streaks ─────────────────────────────────────────── */}
      <SectionLabel label="Rachas" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <StreakCard label="Ingresos en 24h" value={streaks.ingresosAsignados24h} icon="⚡" />
        <StreakCard label="Días activos" value={streaks.diasActivos} icon="🔥" />
        <StreakCard label="Meses ↑ patrimonio" value={streaks.mesesAumentandoPatrimonio} icon="📈" />
        <StreakCard label="Meses capturando 30%+" value={streaks.mesesCapturando30} icon="🎯" />
      </div>

      {/* ─── Health Score detalle ─────────────────────────────── */}
      <SectionLabel label="Salud Financiera" />
      <div style={{ background: "#fff", borderRadius: 16, padding: "16px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: health.color }}>{health.score}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: health.color }}>{health.clasificacion}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#aaa" }}>
            <div>0–40 Crítico</div>
            <div>41–60 Vulnerable</div>
            <div>61–80 Estable</div>
            <div>81–100 Fuerte</div>
          </div>
        </div>
        {[
          { k: "liquidez",   label: "Liquidez",   v: health.factores.liquidez   },
          { k: "tarjetas",   label: "Tarjetas",   v: health.factores.tarjetas   },
          { k: "deuda",      label: "Carga deuda",v: health.factores.deuda      },
          { k: "captura",    label: "Captura",    v: health.factores.captura    },
          { k: "patrimonio", label: "Patrimonio", v: health.factores.patrimonio },
        ].map(({ k, label, v }) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, color: "#888" }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: v >= 15 ? "#27ae60" : v >= 10 ? "#f39c12" : "#e74c3c" }}>{v}/20</span>
            </div>
            <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${(v / 20) * 100}%`, height: "100%", background: v >= 15 ? "#27ae60" : v >= 10 ? "#f39c12" : "#e74c3c", transition: "width 0.5s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* ─── Ingresos del mes (lista) ─────────────────────────── */}
      {ingresosMes.length > 0 && (
        <>
          <SectionLabel label={`Ingresos este mes (${ingresosMes.length})`} />
          {ingresosMes.slice(0, 8).map((i) => (
            <div key={i.id} style={{
              background: "#fff", borderRadius: 12, padding: "11px 14px", marginBottom: 8,
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e" }}>{fmt(i.monto)}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>
                  {i.origen} · {i.tipo}
                  {i.esExtraordinario && <span style={{ color: "#f39c12", marginLeft: 6 }}>⭐ extraordinario</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#bbb" }}>
                {new Date(i.fecha).toLocaleDateString("es-DO", { day: "numeric", month: "short" })}
              </div>
            </div>
          ))}
        </>
      )}

      {state.ingresos.length === 0 && (
        <div style={{ background: "#f8f9fa", borderRadius: 14, padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 13, color: "#aaa" }}>Registra tus ingresos para ver métricas de captura y progreso mensual.</div>
        </div>
      )}
    </div>
  );
}

function agruparPorMes(ingresos: any[]): Record<string, any[]> {
  const grupos: Record<string, any[]> = {};
  for (const i of ingresos) {
    const f = new Date(i.fecha);
    const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(i);
  }
  return grupos;
}

function SectionLabel({ label }: { label: string }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, margin: "16px 0 10px" }}>{label}</div>;
}

function MetricCard({ label, value, sub, color, large }: { label: string; value: string; sub?: string; color: string; large?: boolean }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
      <div style={{ fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: large ? 20 : 17, fontWeight: 700, color, letterSpacing: -0.3 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#bbb", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function StreakCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "14px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0", textAlign: "center" }}>
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: value > 0 ? "#1a1a2e" : "#ddd" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#aaa", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

const titleStyle: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: "0 0 16px", letterSpacing: -0.5 };
