import type { AppState } from "./types";

export const INITIAL_STATE: AppState = {
  metaFinal: 10_000_000,
  version: 2,

  // ─── V1: Cuentas ──────────────────────────────────────────────────────────
  cuentas: [
    { id: "banres-principal", nombre: "Banreservas Principal", banco: "Banreservas", tipo: "operativa", balance: 8500, descripcion: "Cuenta operativa día a día" },
    { id: "banres-secundaria", nombre: "Banreservas Secundaria", banco: "Banreservas", tipo: "puente", balance: 3200, descripcion: "Cuenta puente para distribución" },
    { id: "qik-emergencia", nombre: "Qik – Fondo Emergencia", banco: "Qik", tipo: "meta", balance: 12000, meta: 100000, descripcion: "Meta inicial RD$100,000 → final RD$200,000" },
    { id: "qik-patrimonio", nombre: "Qik – Patrimonio", banco: "Qik", tipo: "meta", balance: 5000, meta: 10_000_000, descripcion: "Vehículo principal de construcción patrimonial" },
    { id: "qik-disfrute", nombre: "Qik – Disfrute", banco: "Qik", tipo: "meta", balance: 2000, descripcion: "Fondo de disfrute controlado" },
    { id: "qik-vehiculo", nombre: "Qik – Vehículo", banco: "Qik", tipo: "meta", balance: 4500, descripcion: "Cuotas y mantenimiento vehículo" },
    { id: "qik-inmueble", nombre: "Qik – Inmueble Futuro", banco: "Qik", tipo: "meta", balance: 0, descripcion: "Capital semilla para primer inmueble" },
    { id: "popular", nombre: "Popular", banco: "Banco Popular", tipo: "inversion", balance: 0, descripcion: "Cuenta inactiva – futura cuenta de inversión" },
  ],

  // ─── V1: Deudas (legacy, kept for backward compat) ───────────────────────
  // Note: Tarjetas + prestamos are now tracked in detail below.
  // Keep this array to avoid breaking Deudas.tsx for existing users.
  deudas: [],

  // ─── V1: Ingresos ─────────────────────────────────────────────────────────
  ingresos: [],

  // ─── V1: Logros ───────────────────────────────────────────────────────────
  logros: [
    { id: "l1", titulo: "Primer Escudo", descripcion: "Primeros RD$50,000 protegidos", umbral: 50000, tipo: "liquidez", completado: false },
    { id: "l2", titulo: "Fondo Sólido", descripcion: "Primeros RD$100,000 protegidos", umbral: 100000, tipo: "liquidez", completado: false },
    { id: "l3", titulo: "Tarjeta Controlada", descripcion: "Tarjeta principal bajo 50% de límite", umbral: 50, tipo: "deuda", completado: false },
    { id: "l4", titulo: "Constructor Neto", descripcion: "Primeros RD$100,000 patrimoniales", umbral: 100000, tipo: "patrimonio", completado: false },
    { id: "l5", titulo: "Cuarto de Millón", descripcion: "Primeros RD$250,000 netos", umbral: 250000, tipo: "patrimonio", completado: false },
    { id: "l6", titulo: "Medio Millón", descripcion: "Primeros RD$500,000 netos", umbral: 500000, tipo: "patrimonio", completado: false },
    { id: "l7", titulo: "El Primer Millón", descripcion: "RD$1,000,000 en patrimonio neto", umbral: 1_000_000, tipo: "patrimonio", completado: false },
    { id: "l8", titulo: "Cinco Millones", descripcion: "RD$5,000,000 en patrimonio neto", umbral: 5_000_000, tipo: "patrimonio", completado: false },
    { id: "l9", titulo: "Patrimonial", descripcion: "RD$10,000,000 – meta cumplida", umbral: 10_000_000, tipo: "patrimonio", completado: false },
  ],

  // ─── V1: Recompensas ──────────────────────────────────────────────────────
  recompensas: [
    { id: "r1", nombre: "Cena Sin Culpa", descripcion: "Una cena elegante, sin mirar el menú", nivel: 2, reclamada: false },
    { id: "r2", nombre: "Golf Weekend", descripcion: "Un fin de semana en el campo", nivel: 3, reclamada: false },
    { id: "r3", nombre: "Compra Personal", descripcion: "Una compra personal moderada sin justificación", nivel: 4, reclamada: false },
    { id: "r4", nombre: "Viaje Corto", descripcion: "Un viaje de 3-4 días sin presupuesto ajustado", nivel: 5, reclamada: false },
    { id: "r5", nombre: "Celebración Seria", descripcion: "Una celebración memorable por el primer millón", nivel: 7, reclamada: false },
  ],

  advisorMessages: [],

  // ─── V2: Tarjetas de Crédito ───────────────────────────────────────────────
  tarjetas: [
    {
      id: "tarjeta-banreservas",
      nombre: "Tarjeta Banreservas",
      banco: "Banreservas",
      limiteDOP: 170000,
      limiteUSD: 0,
      disponibleDOP: 85000,
      disponibleUSD: 0,
      balanceActualDOP: 85000,
      balanceActualUSD: 0,
      balanceAlCorteDOP: 85000,
      balanceAlCorteUSD: 0,
      pagoMinimoDOP: 8500,
      pagoMinimoUSD: 0,
      diaCorte: 15,
      diaLimitePago: 5,
      tasaAnual: 60,
      notas: "Tarjeta principal – uso alto",
      activa: true,
    },
    {
      id: "tarjeta-combustible",
      nombre: "Tarjeta Combustible",
      banco: "Combustible",
      limiteDOP: 30000,
      limiteUSD: 0,
      disponibleDOP: 18000,
      disponibleUSD: 0,
      balanceActualDOP: 12000,
      balanceActualUSD: 0,
      balanceAlCorteDOP: 12000,
      balanceAlCorteUSD: 0,
      pagoMinimoDOP: 2000,
      pagoMinimoUSD: 0,
      diaCorte: 20,
      diaLimitePago: 10,
      tasaAnual: 0,
      notas: "Tarjeta de combustible",
      activa: true,
    },
  ],

  // ─── V2: Préstamos ────────────────────────────────────────────────────────
  prestamos: [
    {
      id: "prestamo-vehiculo",
      nombre: "Préstamo Vehículo",
      banco: "Banreservas",
      balancePendiente: 980000,
      montoOriginal: 1200000,
      cuotaMensual: 33494,
      tasaAnual: 12,
      diaPago: 5,
      fechaVencimiento: "2028-06-01",
      notas: "Cuota fija mensual",
      activo: true,
    },
  ],

  // ─── V2: Inversiones, Metas, Timeline, Streaks ───────────────────────────
  inversiones: [],
  metasAhorro: [],
  timeline: [],
  streaks: {
    ingresosAsignados24h: 0,
    diasActivos: 0,
    mesesAumentandoPatrimonio: 0,
    mesesCapturando30: 0,
    ultimoIngresoFecha: "",
  },
};

export const STORAGE_KEY = "wealthos-cesar-v2";
export const STORAGE_KEY_V1 = "wealthos-cesar-v1";
