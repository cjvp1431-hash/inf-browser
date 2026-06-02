import React, { createContext, useContext, useEffect, useReducer } from "react";
import type { AppState, Cuenta, Deuda, Ingreso, Recompensa } from "./types";
import { INITIAL_STATE, STORAGE_KEY } from "./initialData";

type Action =
  | { type: "UPDATE_CUENTA"; id: string; balance: number }
  | { type: "ADD_INGRESO"; ingreso: Ingreso }
  | { type: "UPDATE_DEUDA"; id: string; balance: number }
  | { type: "COMPLETE_LOGRO"; id: string }
  | { type: "RECLAMAR_RECOMPENSA"; id: string }
  | { type: "RESET" }
  | { type: "LOAD"; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "UPDATE_CUENTA":
      return {
        ...state,
        cuentas: state.cuentas.map((c) =>
          c.id === action.id ? { ...c, balance: action.balance } : c
        ),
      };
    case "UPDATE_DEUDA":
      return {
        ...state,
        deudas: state.deudas.map((d) =>
          d.id === action.id ? { ...d, balance: action.balance } : d
        ),
      };
    case "ADD_INGRESO":
      return { ...state, ingresos: [action.ingreso, ...state.ingresos] };
    case "COMPLETE_LOGRO":
      return {
        ...state,
        logros: state.logros.map((l) =>
          l.id === action.id
            ? { ...l, completado: true, fechaCompletado: new Date().toISOString() }
            : l
        ),
      };
    case "RECLAMAR_RECOMPENSA":
      return {
        ...state,
        recompensas: state.recompensas.map((r) =>
          r.id === action.id ? { ...r, reclamada: true } : r
        ),
      };
    case "LOAD":
      return action.state;
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
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
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: "LOAD", state: JSON.parse(saved) });
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
