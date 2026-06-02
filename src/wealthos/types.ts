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

export interface AppState {
  cuentas: Cuenta[];
  deudas: Deuda[];
  ingresos: Ingreso[];
  logros: Logro[];
  recompensas: Recompensa[];
  metaFinal: number;
  advisorMessages: string[];
}
