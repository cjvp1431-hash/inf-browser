import React, { useState } from "react";
import { useStore } from "../store";
import { calcularUtilizacionTarjeta, clasificarTasa, TASA_COLORS, diasHastaFecha, costoAnualEstimado } from "../engine";
import type { TarjetaCredito, Prestamo, InversionProducto, MetaAhorro } from "../types";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);

type ProductTab = "tarjetas" | "prestamos" | "inversiones" | "metas";

export default function ProductosFinancieros() {
  const [tab, setTab] = useState<ProductTab>("tarjetas");

  return (
    <div style={{ padding: "4px 0 24px" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, margin: "0 16px 16px", background: "#f0f0f0", borderRadius: 12, padding: 4 }}>
        {(["tarjetas", "prestamos", "inversiones", "metas"] as const).map((t) => {
          const labels = { tarjetas: "💳 Tarjetas", prestamos: "🏛️ Préstamos", inversiones: "📈 Inversiones", metas: "🎯 Metas" };
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 4px", border: "none", borderRadius: 9,
              background: tab === t ? "#fff" : "transparent",
              fontSize: 11, fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "#1a1a2e" : "#888",
              cursor: "pointer", boxShadow: tab === t ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
              fontFamily: "inherit", transition: "all 0.15s",
            }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "0 16px" }}>
        {tab === "tarjetas"    && <TarjetasTab />}
        {tab === "prestamos"   && <PrestamosTab />}
        {tab === "inversiones" && <InversionesTab />}
        {tab === "metas"       && <MetasAhorroTab />}
      </div>
    </div>
  );
}

// ─── TARJETAS ──────────────────────────────────────────────────────────────

function TarjetasTab() {
  const { state, dispatch } = useStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const tarjetas = state.tarjetas ?? [];

  function blank(): Omit<TarjetaCredito, "id"> {
    return { nombre: "", banco: "", limiteDOP: 0, limiteUSD: 0, disponibleDOP: 0, disponibleUSD: 0, balanceActualDOP: 0, balanceActualUSD: 0, balanceAlCorteDOP: 0, balanceAlCorteUSD: 0, pagoMinimoDOP: 0, pagoMinimoUSD: 0, diaCorte: 0, diaLimitePago: 0, tasaAnual: 0, notas: "", activa: true };
  }

  const [form, setForm] = useState<Omit<TarjetaCredito, "id">>(blank());

  function openAdd() { setForm(blank()); setEditId(null); setShowForm(true); }
  function openEdit(t: TarjetaCredito) { const { id, ...rest } = t; setForm(rest); setEditId(id); setShowForm(true); }
  function cancel() { setShowForm(false); setEditId(null); }

  function save() {
    if (!form.nombre) return;
    if (editId) {
      dispatch({ type: "UPDATE_TARJETA", id: editId, data: form });
    } else {
      dispatch({ type: "ADD_TARJETA", tarjeta: { ...form, id: `tc-${Date.now()}` } });
    }
    cancel();
  }

  if (showForm) return <TarjetaForm form={form} onChange={(f) => setForm(f)} onSave={save} onCancel={cancel} editMode={!!editId} />;

  return (
    <>
      <AddButton onClick={openAdd} label="Agregar tarjeta" />
      {tarjetas.length === 0 && <EmptyMsg label="Sin tarjetas registradas" />}
      {tarjetas.map((t) => {
        const util = calcularUtilizacionTarjeta(t);
        const utilColor = util >= 80 ? "#e74c3c" : util >= 50 ? "#f39c12" : "#27ae60";
        return (
          <div key={t.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{t.nombre}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{t.banco} · Tasa {t.tasaAnual}%</div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: "#888" }}>Utilización</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: utilColor }}>{util.toFixed(0)}%</span>
                  </div>
                  <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, util)}%`, height: "100%", background: utilColor }} />
                  </div>
                </div>
                <div style={{ fontSize: 12, marginTop: 6, color: "#e74c3c", fontWeight: 700 }}>
                  {fmt(t.balanceActualDOP)} <span style={{ color: "#aaa", fontWeight: 400 }}>/ {fmt(t.limiteDOP)}</span>
                </div>
                {t.tasaAnual > 0 && (
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                    Costo anual est. {fmt(costoAnualEstimado(t.balanceActualDOP, t.tasaAnual))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
                <SmallBtn label="✏️" onClick={() => openEdit(t)} />
                <SmallBtn label="🗑️" onClick={() => dispatch({ type: "DELETE_TARJETA", id: t.id })} danger />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function TarjetaForm({ form, onChange, onSave, onCancel, editMode }: {
  form: Omit<TarjetaCredito, "id">; onChange: (f: Omit<TarjetaCredito, "id">) => void;
  onSave: () => void; onCancel: () => void; editMode: boolean;
}) {
  const f = (k: keyof typeof form, v: any) => onChange({ ...form, [k]: v });
  return (
    <div>
      <FormTitle>{editMode ? "Editar Tarjeta" : "Nueva Tarjeta"}</FormTitle>
      <Field label="Nombre"><Input v={form.nombre} onChange={(v) => f("nombre", v)} placeholder="Ej: Tarjeta Visa" /></Field>
      <Field label="Banco"><Input v={form.banco} onChange={(v) => f("banco", v)} placeholder="Ej: Banreservas" /></Field>
      <Field label="Límite DOP"><NumInput v={form.limiteDOP} onChange={(v) => f("limiteDOP", v)} /></Field>
      <Field label="Balance actual DOP"><NumInput v={form.balanceActualDOP} onChange={(v) => f("balanceActualDOP", v)} /></Field>
      <Field label="Pago mínimo DOP"><NumInput v={form.pagoMinimoDOP} onChange={(v) => f("pagoMinimoDOP", v)} /></Field>
      <Field label="Tasa anual %"><NumInput v={form.tasaAnual} onChange={(v) => f("tasaAnual", v)} /></Field>
      <Field label="Día de corte (1-31)"><NumInput v={form.diaCorte} onChange={(v) => f("diaCorte", v)} /></Field>
      <Field label="Día límite de pago (1-31)"><NumInput v={form.diaLimitePago} onChange={(v) => f("diaLimitePago", v)} /></Field>
      <Field label="Balance al corte DOP"><NumInput v={form.balanceAlCorteDOP} onChange={(v) => f("balanceAlCorteDOP", v)} /></Field>
      <Field label="Notas"><Input v={form.notas} onChange={(v) => f("notas", v)} placeholder="Opcional" /></Field>
      <FormBtns onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

// ─── PRÉSTAMOS ─────────────────────────────────────────────────────────────

function PrestamosTab() {
  const { state, dispatch } = useStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const blankPrestamo = (): Omit<Prestamo, "id"> => ({ nombre: "", banco: "", balancePendiente: 0, montoOriginal: 0, cuotaMensual: 0, tasaAnual: 0, diaPago: 0, fechaVencimiento: "", notas: "", activo: true });
  const [form, setForm] = useState<Omit<Prestamo, "id">>(blankPrestamo());

  function openAdd() { setForm(blankPrestamo()); setEditId(null); setShowForm(true); }
  function openEdit(p: Prestamo) { const { id, ...rest } = p; setForm(rest); setEditId(id); setShowForm(true); }
  function cancel() { setShowForm(false); setEditId(null); }
  function save() {
    if (!form.nombre) return;
    if (editId) dispatch({ type: "UPDATE_PRESTAMO", id: editId, data: form });
    else dispatch({ type: "ADD_PRESTAMO", prestamo: { ...form, id: `pr-${Date.now()}` } });
    cancel();
  }

  const prestamos = state.prestamos ?? [];

  if (showForm) return <PrestamoForm form={form} onChange={setForm} onSave={save} onCancel={cancel} editMode={!!editId} />;

  return (
    <>
      <AddButton onClick={openAdd} label="Agregar préstamo" />
      {prestamos.length === 0 && <EmptyMsg label="Sin préstamos registrados" />}
      {prestamos.map((p) => {
        const amortizado = p.montoOriginal > 0 ? ((p.montoOriginal - p.balancePendiente) / p.montoOriginal) * 100 : 0;
        const meses = p.cuotaMensual > 0 ? Math.ceil(p.balancePendiente / p.cuotaMensual) : null;
        return (
          <div key={p.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{p.nombre}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{p.banco} · {fmt(p.cuotaMensual)}/mes · {p.tasaAnual}%</div>
                {p.montoOriginal > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: "#888" }}>Amortizado</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#27ae60" }}>{amortizado.toFixed(1)}%</span>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div style={{ width: `${amortizado}%`, height: "100%", background: "#27ae60" }} />
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 12, marginTop: 6, color: "#e74c3c", fontWeight: 700 }}>
                  {fmt(p.balancePendiente)} pendiente
                  {meses && <span style={{ color: "#aaa", fontWeight: 400 }}> · ~{meses} meses</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
                <SmallBtn label="✏️" onClick={() => openEdit(p)} />
                <SmallBtn label="🗑️" onClick={() => dispatch({ type: "DELETE_PRESTAMO", id: p.id })} danger />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function PrestamoForm({ form, onChange, onSave, onCancel, editMode }: {
  form: Omit<Prestamo, "id">; onChange: (f: Omit<Prestamo, "id">) => void;
  onSave: () => void; onCancel: () => void; editMode: boolean;
}) {
  const f = (k: keyof typeof form, v: any) => onChange({ ...form, [k]: v });
  return (
    <div>
      <FormTitle>{editMode ? "Editar Préstamo" : "Nuevo Préstamo"}</FormTitle>
      <Field label="Nombre"><Input v={form.nombre} onChange={(v) => f("nombre", v)} placeholder="Ej: Préstamo Vehículo" /></Field>
      <Field label="Banco"><Input v={form.banco} onChange={(v) => f("banco", v)} placeholder="Ej: Banreservas" /></Field>
      <Field label="Balance pendiente DOP"><NumInput v={form.balancePendiente} onChange={(v) => f("balancePendiente", v)} /></Field>
      <Field label="Monto original DOP"><NumInput v={form.montoOriginal} onChange={(v) => f("montoOriginal", v)} /></Field>
      <Field label="Cuota mensual DOP"><NumInput v={form.cuotaMensual} onChange={(v) => f("cuotaMensual", v)} /></Field>
      <Field label="Tasa anual %"><NumInput v={form.tasaAnual} onChange={(v) => f("tasaAnual", v)} /></Field>
      <Field label="Día de pago (1-31)"><NumInput v={form.diaPago} onChange={(v) => f("diaPago", v)} /></Field>
      <Field label="Fecha vencimiento"><Input v={form.fechaVencimiento} onChange={(v) => f("fechaVencimiento", v)} placeholder="YYYY-MM-DD" /></Field>
      <Field label="Notas"><Input v={form.notas} onChange={(v) => f("notas", v)} placeholder="Opcional" /></Field>
      <FormBtns onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

// ─── INVERSIONES ───────────────────────────────────────────────────────────

function InversionesTab() {
  const { state, dispatch } = useStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const blankInv = (): Omit<InversionProducto, "id"> => ({ nombre: "", tipo: "otro", balanceActual: 0, aporteMensual: 0, rendimientoEsperadoAnual: 0, notas: "", activa: true });
  const [form, setForm] = useState<Omit<InversionProducto, "id">>(blankInv());

  function save() {
    if (!form.nombre) return;
    if (editId) dispatch({ type: "UPDATE_INVERSION", id: editId, data: form });
    else dispatch({ type: "ADD_INVERSION", inversion: { ...form, id: `inv-${Date.now()}` } });
    setShowForm(false); setEditId(null);
  }
  function openEdit(i: InversionProducto) { const { id, ...rest } = i; setForm(rest); setEditId(id); setShowForm(true); }

  const inversiones = state.inversiones ?? [];

  if (showForm) {
    const f = (k: keyof typeof form, v: any) => setForm({ ...form, [k]: v });
    return (
      <div>
        <FormTitle>{editId ? "Editar Inversión" : "Nueva Inversión"}</FormTitle>
        <Field label="Nombre"><Input v={form.nombre} onChange={(v) => f("nombre", v)} placeholder="Ej: ETF S&P 500" /></Field>
        <Field label="Tipo">
          <select value={form.tipo} onChange={(e) => f("tipo", e.target.value)} style={inputStyle}>
            {["ETF", "fondo", "inmueble", "negocio", "certificado", "otro"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Balance actual DOP"><NumInput v={form.balanceActual} onChange={(v) => f("balanceActual", v)} /></Field>
        <Field label="Aporte mensual DOP"><NumInput v={form.aporteMensual} onChange={(v) => f("aporteMensual", v)} /></Field>
        <Field label="Rendimiento esperado anual %"><NumInput v={form.rendimientoEsperadoAnual} onChange={(v) => f("rendimientoEsperadoAnual", v)} /></Field>
        <Field label="Notas"><Input v={form.notas} onChange={(v) => f("notas", v)} placeholder="Opcional" /></Field>
        <FormBtns onSave={save} onCancel={() => { setShowForm(false); setEditId(null); }} />
      </div>
    );
  }

  return (
    <>
      <AddButton onClick={() => { setForm(blankInv()); setEditId(null); setShowForm(true); }} label="Agregar inversión" />
      {inversiones.length === 0 && <EmptyMsg label="Sin inversiones. Cuando llegues a Fase 2, aquí registrarás tus primeros activos productivos." />}
      {inversiones.map((inv) => (
        <div key={inv.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{inv.nombre}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{inv.tipo}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#27ae60", marginTop: 6 }}>{fmt(inv.balanceActual)}</div>
              {inv.rendimientoEsperadoAnual > 0 && (
                <div style={{ fontSize: 11, color: "#27ae60" }}>
                  Rendimiento est. {fmt(inv.balanceActual * inv.rendimientoEsperadoAnual / 100)}/año
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <SmallBtn label="✏️" onClick={() => openEdit(inv)} />
              <SmallBtn label="🗑️" onClick={() => dispatch({ type: "DELETE_INVERSION", id: inv.id })} danger />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ─── METAS DE AHORRO ───────────────────────────────────────────────────────

function MetasAhorroTab() {
  const { state, dispatch } = useStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const blankMeta = (): Omit<MetaAhorro, "id"> => ({ nombre: "", balanceActual: 0, metaObjetivo: 0, fechaObjetivo: "", notas: "", activa: true });
  const [form, setForm] = useState<Omit<MetaAhorro, "id">>(blankMeta());

  function save() {
    if (!form.nombre || form.metaObjetivo <= 0) return;
    if (editId) dispatch({ type: "UPDATE_META_AHORRO", id: editId, data: form });
    else dispatch({ type: "ADD_META_AHORRO", meta: { ...form, id: `ma-${Date.now()}` } });
    setShowForm(false); setEditId(null);
  }
  function openEdit(m: MetaAhorro) { const { id, ...rest } = m; setForm(rest); setEditId(id); setShowForm(true); }

  const metas = state.metasAhorro ?? [];

  if (showForm) {
    const f = (k: keyof typeof form, v: any) => setForm({ ...form, [k]: v });
    return (
      <div>
        <FormTitle>{editId ? "Editar Meta" : "Nueva Meta de Ahorro"}</FormTitle>
        <Field label="Nombre"><Input v={form.nombre} onChange={(v) => f("nombre", v)} placeholder="Ej: Viaje Europa" /></Field>
        <Field label="Balance actual DOP"><NumInput v={form.balanceActual} onChange={(v) => f("balanceActual", v)} /></Field>
        <Field label="Meta objetivo DOP"><NumInput v={form.metaObjetivo} onChange={(v) => f("metaObjetivo", v)} /></Field>
        <Field label="Fecha objetivo"><Input v={form.fechaObjetivo} onChange={(v) => f("fechaObjetivo", v)} placeholder="YYYY-MM-DD (opcional)" /></Field>
        <Field label="Notas"><Input v={form.notas} onChange={(v) => f("notas", v)} placeholder="Opcional" /></Field>
        <FormBtns onSave={save} onCancel={() => { setShowForm(false); setEditId(null); }} />
      </div>
    );
  }

  return (
    <>
      <AddButton onClick={() => { setForm(blankMeta()); setEditId(null); setShowForm(true); }} label="Agregar meta" />
      {metas.length === 0 && <EmptyMsg label="Sin metas de ahorro adicionales. Las metas Qik aparecen en Mi Mundo." />}
      {metas.filter(m => m.activa).map((m) => {
        const prog = m.metaObjetivo > 0 ? Math.min(100, (m.balanceActual / m.metaObjetivo) * 100) : 0;
        return (
          <div key={m.id} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e" }}>{m.nombre}</div>
                {m.fechaObjetivo && <div style={{ fontSize: 11, color: "#aaa" }}>{m.fechaObjetivo}</div>}
                <div style={{ marginTop: 8, background: "#f0f0f0", borderRadius: 4, height: 6, overflow: "hidden" }}>
                  <div style={{ width: `${prog}%`, height: "100%", background: "#5c6bc0" }} />
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <span style={{ fontWeight: 700, color: "#1a1a2e" }}>{fmt(m.balanceActual)}</span>
                  <span style={{ color: "#aaa" }}> / {fmt(m.metaObjetivo)} ({prog.toFixed(1)}%)</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 10 }}>
                <SmallBtn label="✏️" onClick={() => openEdit(m)} />
                <SmallBtn label="🗑️" onClick={() => dispatch({ type: "DELETE_META_AHORRO", id: m.id })} danger />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ─── Shared UI primitives ──────────────────────────────────────────────────

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "12px", marginBottom: 12,
      background: "linear-gradient(135deg, #0a0a1a, #1a1a3e)",
      color: "#fff", border: "none", borderRadius: 12,
      fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    }}>
      + {label}
    </button>
  );
}

function SmallBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: danger ? "#fdf0ef" : "#f8f9fa",
      border: "none", borderRadius: 8, width: 34, height: 34,
      fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ v, onChange, placeholder }: { v: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />;
}

function NumInput({ v, onChange }: { v: number; onChange: (v: number) => void }) {
  return <input type="number" value={v || ""} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} style={inputStyle} />;
}

function FormBtns({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
      <button onClick={onSave} style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #0a0a1a, #1a1a3e)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Guardar</button>
      <button onClick={onCancel} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: "#f0f0f0", color: "#666", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
    </div>
  );
}

function FormTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: "0 0 16px", letterSpacing: -0.3 }}>{children}</h3>;
}

function EmptyMsg({ label }: { label: string }) {
  return <div style={{ background: "#f8f9fa", borderRadius: 14, padding: "16px", textAlign: "center", fontSize: 13, color: "#aaa", marginBottom: 12 }}>{label}</div>;
}

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 16, padding: "14px 16px", marginBottom: 10,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 12px", borderRadius: 10,
  border: "1.5px solid #e9ecef", fontSize: 14, color: "#1a1a2e",
  background: "#fff", boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};
