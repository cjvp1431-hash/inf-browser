import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { AppState, TarjetaCredito, Prestamo, InversionProducto, MetaAhorro, TimelineEntry, Streaks, Ingreso } from "./types";
import { INITIAL_STATE, STORAGE_KEY, STORAGE_KEY_V1 } from "./initialData";

type Action =
  // ─── V1 actions (unchanged) ─────────────────────────────────────────────
  | { type: "UPDATE_CUENTA"; id: string; balance: number }
  | { type: "ADD_INGRESO"; ingreso: Ingreso }
  | { type: "UPDATE_DEUDA"; id: string; balance: number }
  | { type: "COMPLETE_LOGRO"; id: string }
  | { type: "RECLAMAR_RECOMPENSA"; id: string }
  | { type: "RESET" }
  | { type: "LOAD"; state: AppState }
  // ─── V2 Tarjetas ────────────────────────────────────────────────────────
  | { type: "ADD_TARJETA"; tarjeta: TarjetaCredito }
  | { type: "UPDATE_TARJETA"; id: string; data: Partial<TarjetaCredito> }
  | { type: "DELETE_TARJETA"; id: string }
  // ─── V2 Préstamos ───────────────────────────────────────────────────────
  | { type: "ADD_PRESTAMO"; prestamo: Prestamo }
  | { type: "UPDATE_PRESTAMO"; id: string; data: Partial<Prestamo> }
  | { type: "DELETE_PRESTAMO"; id: string }
  // ─── V2 Inversiones ─────────────────────────────────────────────────────
  | { type: "ADD_INVERSION"; inversion: InversionProducto }
  | { type: "UPDATE_INVERSION"; id: string; data: Partial<InversionProducto> }
  | { type: "DELETE_INVERSION"; id: string }
  // ─── V2 Metas de ahorro ─────────────────────────────────────────────────
  | { type: "ADD_META_AHORRO"; meta: MetaAhorro }
  | { type: "UPDATE_META_AHORRO"; id: string; data: Partial<MetaAhorro> }
  | { type: "DELETE_META_AHORRO"; id: string }
  // ─── V2 Timeline & Streaks ──────────────────────────────────────────────
  | { type: "ADD_TIMELINE"; entry: TimelineEntry }
  | { type: "UPDATE_STREAKS"; data: Partial<Streaks> }
  // ─── V2 Ejecutar distribución ───────────────────────────────────────────
  | { type: "EJECUTAR_DISTRIBUCION"; items: Array<{ cuentaId: string; monto: number }> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    // V1
    case "UPDATE_CUENTA":
      return { ...state, cuentas: state.cuentas.map((c) => c.id === action.id ? { ...c, balance: action.balance } : c) };
    case "UPDATE_DEUDA":
      return { ...state, deudas: state.deudas.map((d) => d.id === action.id ? { ...d, balance: action.balance } : d) };
    case "ADD_INGRESO":
      return { ...state, ingresos: [action.ingreso, ...state.ingresos] };
    case "COMPLETE_LOGRO":
      return { ...state, logros: state.logros.map((l) => l.id === action.id ? { ...l, completado: true, fechaCompletado: new Date().toISOString() } : l) };
    case "RECLAMAR_RECOMPENSA":
      return { ...state, recompensas: state.recompensas.map((r) => r.id === action.id ? { ...r, reclamada: true } : r) };
    case "LOAD":
      return migrateState(action.state);
    case "RESET":
      return INITIAL_STATE;

    // Tarjetas
    case "ADD_TARJETA":
      return { ...state, tarjetas: [...(state.tarjetas ?? []), action.tarjeta] };
    case "UPDATE_TARJETA":
      return { ...state, tarjetas: (state.tarjetas ?? []).map((t) => t.id === action.id ? { ...t, ...action.data } : t) };
    case "DELETE_TARJETA":
      return { ...state, tarjetas: (state.tarjetas ?? []).filter((t) => t.id !== action.id) };

    // Préstamos
    case "ADD_PRESTAMO":
      return { ...state, prestamos: [...(state.prestamos ?? []), action.prestamo] };
    case "UPDATE_PRESTAMO":
      return { ...state, prestamos: (state.prestamos ?? []).map((p) => p.id === action.id ? { ...p, ...action.data } : p) };
    case "DELETE_PRESTAMO":
      return { ...state, prestamos: (state.prestamos ?? []).filter((p) => p.id !== action.id) };

    // Inversiones
    case "ADD_INVERSION":
      return { ...state, inversiones: [...(state.inversiones ?? []), action.inversion] };
    case "UPDATE_INVERSION":
      return { ...state, inversiones: (state.inversiones ?? []).map((i) => i.id === action.id ? { ...i, ...action.data } : i) };
    case "DELETE_INVERSION":
      return { ...state, inversiones: (state.inversiones ?? []).filter((i) => i.id !== action.id) };

    // Metas de ahorro
    case "ADD_META_AHORRO":
      return { ...state, metasAhorro: [...(state.metasAhorro ?? []), action.meta] };
    case "UPDATE_META_AHORRO":
      return { ...state, metasAhorro: (state.metasAhorro ?? []).map((m) => m.id === action.id ? { ...m, ...action.data } : m) };
    case "DELETE_META_AHORRO":
      return { ...state, metasAhorro: (state.metasAhorro ?? []).filter((m) => m.id !== action.id) };

    // Timeline & Streaks
    case "ADD_TIMELINE":
      return { ...state, timeline: [action.entry, ...(state.timeline ?? [])] };
    case "UPDATE_STREAKS":
      return { ...state, streaks: { ...(state.streaks ?? INITIAL_STATE.streaks), ...action.data } };

    // Ejecutar distribución
    case "EJECUTAR_DISTRIBUCION": {
      let cuentas = [...state.cuentas];
      for (const { cuentaId, monto } of action.items) {
        cuentas = cuentas.map((c) => c.id === cuentaId ? { ...c, balance: c.balance + monto } : c);
      }
      const entry: TimelineEntry = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        tipo: "distribucion",
        descripcion: `Distribución ejecutada – ${action.items.length} destinos actualizados`,
        snapshotLiquidez: cuentas.filter((c) => c.tipo === "meta" || c.tipo === "puente").reduce((s, c) => s + c.balance, 0),
      };
      return { ...state, cuentas, timeline: [entry, ...(state.timeline ?? [])] };
    }

    default:
      return state;
  }
}

function migrateState(saved: any): AppState {
  if (!saved) return INITIAL_STATE;
  // If v1 data (no version field), add v2 fields
  if (!saved.version || saved.version < 2) {
    return {
      ...INITIAL_STATE,
      ...saved,
      // Overlay v2 fields that didn't exist in v1
      tarjetas: saved.tarjetas ?? INITIAL_STATE.tarjetas,
      prestamos: saved.prestamos ?? INITIAL_STATE.prestamos,
      inversiones: saved.inversiones ?? [],
      metasAhorro: saved.metasAhorro ?? [],
      timeline: saved.timeline ?? [],
      streaks: saved.streaks ?? INITIAL_STATE.streaks,
      version: 2,
    };
  }
  // Ensure all v2 arrays exist even for partial saves
  return {
    ...saved,
    tarjetas: saved.tarjetas ?? INITIAL_STATE.tarjetas,
    prestamos: saved.prestamos ?? INITIAL_STATE.prestamos,
    inversiones: saved.inversiones ?? [],
    metasAhorro: saved.metasAhorro ?? [],
    timeline: saved.timeline ?? [],
    streaks: saved.streaks ?? INITIAL_STATE.streaks,
  };
}

interface StoreCtx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    try {
      // Try v2 key first, then migrate from v1
      const savedV2 = localStorage.getItem(STORAGE_KEY);
      if (savedV2) {
        dispatch({ type: "LOAD", state: JSON.parse(savedV2) });
        return;
      }
      const savedV1 = localStorage.getItem(STORAGE_KEY_V1);
      if (savedV1) {
        dispatch({ type: "LOAD", state: JSON.parse(savedV1) });
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
