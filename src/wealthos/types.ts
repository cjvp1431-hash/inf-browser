// ─── V1 Types (unchanged) ──────────────────────────────────────────────────
export type Fase = 1 | 2 | 3;

export interface Cuenta {
  id: string;
  nombre: string;
  banco: string;
  tipo: "operativa" | "puente" | "meta" | "inversion" | "efectivo";
  balance: number;
  meta?: number;
  descripcion?: string;
}

export interface Deuda {
  id: string;
  nombre: string;
  balance: number;
  pagoMensual: number;
  tasa?: number;
  fechaPago?: string;
  prioridad: "alta" | "media" | "baja";
}

export interface Ingreso {
  id: string;
  monto: number;
  fecha: string;
  tipo: "transferencia" | "efectivo" | "otro";
  origen: "honorarios" | "variable" | "extraordinario" | "regalo" | "otro";
  esExtraordinario: boolean;
  hayCompromisos: boolean;
  notas?: string;
}

export interface Distribucion {
  categoria: string;
  porcentaje: number;
  monto: number;
  destino?: string;
  color: string;
}

export interface Logro {
  id: string;
  titulo: string;
  descripcion: string;
  umbral: number;
  tipo: "patrimonio" | "liquidez" | "deuda";
  completado: boolean;
  fechaCompletado?: string;
}

export interface Recompensa {
  id: string;
  nombre: string;
  descripcion: string;
  nivel: number;
  reclamada: boolean;
}

// ─── V2 New Types ──────────────────────────────────────────────────────────

export interface TarjetaCredito {
  id: string;
  nombre: string;
  banco: string;
  limiteDOP: number;
  limiteUSD: number;
  disponibleDOP: number;
  disponibleUSD: number;
  balanceActualDOP: number;
  balanceActualUSD: number;
  balanceAlCorteDOP: number;
  balanceAlCorteUSD: number;
  pagoMinimoDOP: number;
  pagoMinimoUSD: number;
  diaCorte: number;
  diaLimitePago: number;
  tasaAnual: number;
  notas: string;
  activa: boolean;
}

export interface Prestamo {
  id: string;
  nombre: string;
  banco: string;
  balancePendiente: number;
  montoOriginal: number;
  cuotaMensual: number;
  tasaAnual: number;
  diaPago: number;
  fechaVencimiento: string;
  notas: string;
  activo: boolean;
}

export interface InversionProducto {
  id: string;
  nombre: string;
  tipo: "ETF" | "fondo" | "inmueble" | "negocio" | "certificado" | "otro";
  balanceActual: number;
  aporteMensual: number;
  rendimientoEsperadoAnual: number;
  notas: string;
  activa: boolean;
}

export interface MetaAhorro {
  id: string;
  nombre: string;
  balanceActual: number;
  metaObjetivo: number;
  fechaObjetivo: string;
  notas: string;
  activa: boolean;
}

export interface TimelineEntry {
  id: string;
  fecha: string;
  tipo: "ingreso" | "distribucion" | "balance" | "logro";
  descripcion: string;
  monto?: number;
  snapshotLiquidez?: number;
  snapshotPatrimonio?: number;
  snapshotDeudas?: number;
}

export interface Streaks {
  ingresosAsignados24h: number;
  diasActivos: number;
  mesesAumentandoPatrimonio: number;
  mesesCapturando30: number;
  ultimoIngresoFecha: string;
}

export type ClasificacionTasa = "verde" | "amarillo" | "rojo" | "critico";

export interface DeudaRanking {
  id: string;
  nombre: string;
  tipo: "tarjeta" | "prestamo" | "deuda";
  balance: number;
  cuotaMensual: number;
  tasaAnual: number;
  utilizacion?: number;
  prioridad: "critica" | "alta" | "media" | "baja";
  razon: string;
  clasificacionTasa: ClasificacionTasa;
}

export interface ObjetivoDinamico {
  label: string;
  actual: number;
  meta: number;
  tipo: "liquidez" | "tarjeta" | "patrimonio";
  detalle: string;
}

export interface HealthScore {
  score: number;
  clasificacion: "Crítico" | "Vulnerable" | "Estable" | "Fuerte";
  color: string;
  factores: {
    liquidez: number;
    tarjetas: number;
    deuda: number;
    captura: number;
    patrimonio: number;
  };
}

// ─── AppState (extends v1 with v2 fields) ─────────────────────────────────

export interface AppState {
  // v1 (preserved)
  cuentas: Cuenta[];
  deudas: Deuda[];
  ingresos: Ingreso[];
  logros: Logro[];
  recompensas: Recompensa[];
  metaFinal: number;
  advisorMessages: string[];
  // v2 additions
  tarjetas: TarjetaCredito[];
  prestamos: Prestamo[];
  inversiones: InversionProducto[];
  metasAhorro: MetaAhorro[];
  timeline: TimelineEntry[];
  streaks: Streaks;
  version: number;
}
