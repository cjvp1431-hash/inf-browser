import type { AppState, Cuenta, Deuda, Fase, Distribucion } from "./types";

export function calcularPatrimonioNeto(cuentas: Cuenta[], deudas: Deuda[]): number {
  const activos = cuentas.reduce((s, c) => s + c.balance, 0);
  const pasivos = deudas.reduce((s, d) => s + d.balance, 0);
  return activos - pasivos;
}

export function calcularLiquidezProtegida(cuentas: Cuenta[]): number {
  return cuentas
    .filter((c) => c.tipo === "meta" || c.tipo === "puente")
    .reduce((s, c) => s + c.balance, 0);
}

export function calcularLiquidezDisponible(cuentas: Cuenta[]): number {
  return cuentas
    .filter((c) => c.tipo === "operativa" || c.tipo === "efectivo")
    .reduce((s, c) => s + c.balance, 0);
}

export function calcularTotalDeudas(deudas: Deuda[]): number {
  return deudas.reduce((s, d) => s + d.balance, 0);
}

export function determinarFase(cuentas: Cuenta[], deudas: Deuda[]): Fase {
  const liquidez = calcularLiquidezProtegida(cuentas);
  const tarjetas = deudas.filter((d) => d.nombre.toLowerCase().includes("tarjeta"));
  const totalTarjetas = tarjetas.reduce((s, d) => s + d.balance, 0);

  if (liquidez >= 200_000 && totalTarjetas < 50_000) return 3;
  if (liquidez >= 100_000 && totalTarjetas < 100_000) return 2;
  return 1;
}

export function calcularNivel(liquidezProtegida: number): {
  nivel: number;
  nombre: string;
  min: number;
  max: number;
} {
  const niveles = [
    { nivel: 1, nombre: "Fundador", min: 0, max: 50_000 },
    { nivel: 2, nombre: "Estable", min: 50_000, max: 100_000 },
    { nivel: 3, nombre: "Constructor", min: 100_000, max: 250_000 },
    { nivel: 4, nombre: "Acumulador", min: 250_000, max: 1_000_000 },
    { nivel: 5, nombre: "Inversionista", min: 1_000_000, max: 5_000_000 },
    { nivel: 6, nombre: "Libre", min: 5_000_000, max: 10_000_000 },
    { nivel: 7, nombre: "Patrimonial", min: 10_000_000, max: Infinity },
  ];
  return niveles.find((n) => liquidezProtegida >= n.min && liquidezProtegida < n.max) ?? niveles[0];
}

export function calcularProgreso(valor: number, meta: number): number {
  return Math.min(100, Math.max(0, (valor / meta) * 100));
}

export function calcularFechaEstimada(
  patrimonioNeto: number,
  meta: number,
  ingresoMensualEstimado = 150_000,
  tasaAhorro = 0.3
): string {
  if (patrimonioNeto >= meta) return "¡Meta alcanzada!";
  const faltante = meta - patrimonioNeto;
  const ahorroMensual = ingresoMensualEstimado * tasaAhorro;
  if (ahorroMensual <= 0) return "Indefinida";
  const meses = Math.ceil(faltante / ahorroMensual);
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + meses);
  return fecha.toLocaleDateString("es-DO", { month: "long", year: "numeric" });
}

export function generarDistribucion(
  monto: number,
  fase: Fase,
  esExtraordinario: boolean,
  hayCompromisos: boolean
): Distribucion[] {
  if (esExtraordinario && !hayCompromisos) {
    return [
      { categoria: "Patrimonio / Inmueble Futuro", porcentaje: 40, monto: monto * 0.4, destino: "Qik Patrimonio", color: "#1a1a2e" },
      { categoria: "Fondo Emergencia", porcentaje: 15, monto: monto * 0.15, destino: "Qik Emergencia", color: "#16213e" },
      { categoria: "Tarjetas / Deudas", porcentaje: 15, monto: monto * 0.15, destino: "Banreservas Principal", color: "#e74c3c" },
      { categoria: "Vida / Operativo", porcentaje: 20, monto: monto * 0.2, destino: "Banreservas Principal", color: "#2ecc71" },
      { categoria: "Disfrute / Recompensa", porcentaje: 10, monto: monto * 0.1, destino: "Qik Disfrute", color: "#f39c12" },
    ];
  }

  if (fase === 1) {
    return [
      { categoria: "Estabilidad / Patrimonio", porcentaje: 30, monto: monto * 0.3, destino: "Qik (70% Emergencia, 30% Patrimonio)", color: "#1a1a2e" },
      { categoria: "Tarjetas", porcentaje: 20, monto: monto * 0.2, destino: "Banreservas Tarjeta", color: "#e74c3c" },
      { categoria: "Vehículo / Compromisos", porcentaje: 10, monto: monto * 0.1, destino: "Qik Vehículo", color: "#8e44ad" },
      { categoria: "Vida / Operativo", porcentaje: 30, monto: monto * 0.3, destino: "Banreservas Principal", color: "#2ecc71" },
      { categoria: "Disfrute", porcentaje: 10, monto: monto * 0.1, destino: "Qik Disfrute", color: "#f39c12" },
    ];
  }

  if (fase === 2) {
    return [
      { categoria: "Patrimonio", porcentaje: 30, monto: monto * 0.3, destino: "Qik Patrimonio", color: "#1a1a2e" },
      { categoria: "Emergencia", porcentaje: 10, monto: monto * 0.1, destino: "Qik Emergencia", color: "#3498db" },
      { categoria: "Compromisos", porcentaje: 20, monto: monto * 0.2, destino: "Deudas / Vehículo", color: "#e74c3c" },
      { categoria: "Vida / Operativo", porcentaje: 30, monto: monto * 0.3, destino: "Banreservas Principal", color: "#2ecc71" },
      { categoria: "Disfrute", porcentaje: 10, monto: monto * 0.1, destino: "Qik Disfrute", color: "#f39c12" },
    ];
  }

  // Fase 3
  return [
    { categoria: "Inversión / Patrimonio", porcentaje: 30, monto: monto * 0.3, destino: "Qik Patrimonio", color: "#1a1a2e" },
    { categoria: "Inmueble Futuro", porcentaje: 10, monto: monto * 0.1, destino: "Qik Inmueble Futuro", color: "#16213e" },
    { categoria: "Oportunidades", porcentaje: 10, monto: monto * 0.1, destino: "Popular / Inversión", color: "#2980b9" },
    { categoria: "Vida / Operativo", porcentaje: 35, monto: monto * 0.35, destino: "Banreservas Principal", color: "#2ecc71" },
    { categoria: "Disfrute", porcentaje: 15, monto: monto * 0.15, destino: "Qik Disfrute", color: "#f39c12" },
  ];
}

export function sugerirEfectivo(monto: number): { depositar: number; conservar: number; razon: string } {
  const porcentajeDeposito = monto >= 50_000 ? 0.7 : 0.6;
  return {
    depositar: Math.round(monto * porcentajeDeposito),
    conservar: Math.round(monto * (1 - porcentajeDeposito)),
    razon: "Para gastos inmediatos de los próximos 3-5 días",
  };
}

export function generarMensajeAdvisor(
  estado: AppState,
  contexto?: "ingreso" | "logro" | "alerta"
): string {
  const fase = determinarFase(estado.cuentas, estado.deudas);
  const liquidez = calcularLiquidezProtegida(estado.cuentas);
  const patrimonioNeto = calcularPatrimonioNeto(estado.cuentas, estado.deudas);

  const mensajesFase1 = [
    "Este dinero no puede quedarse visible. Así fue como desaparecieron los últimos RD$200,000.",
    "No estás invirtiendo todavía. Estás estabilizando el sistema. Eso también es trabajo.",
    "Las tarjetas altas son el drenaje silencioso. Primero cierra esa fuga, luego construyes.",
    "Modo recuperación activo. Cada peso que proteges hoy compra libertad mañana.",
  ];

  const mensajesFase2 = [
    "Estabilidad desbloqueada. Ya puedes construir patrimonio con más agresividad.",
    "El sistema respira. Ahora el foco es crecer, no solo sobrevivir.",
    "Liquidez básica asegurada. La máquina de acumulación está lista para arrancar.",
  ];

  const mensajesFase3 = [
    "Modo acumulación. El inmueble futuro empieza a tomar forma. Sigue.",
    "Estás en el 20% de la población que realmente construye. No pares.",
    "El próximo nivel está más cerca de lo que parece. La consistencia gana.",
  ];

  const mensajesIngreso = [
    "Ingreso detectado. Tienes menos de 24 horas antes de que desaparezca. Asigna ahora.",
    "Ingreso extraordinario detectado. Recomendación: capturar 40% directo a patrimonio.",
    "El dinero que no se asigna en 24 horas nunca llega a la cuenta de metas. Ley del dinero disponible.",
  ];

  if (contexto === "ingreso") return mensajesIngreso[Math.floor(Math.random() * mensajesIngreso.length)];

  const pool = fase === 1 ? mensajesFase1 : fase === 2 ? mensajesFase2 : mensajesFase3;
  return pool[Math.floor(Math.random() * pool.length)];
}
