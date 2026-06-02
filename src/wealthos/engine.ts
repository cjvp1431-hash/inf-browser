import type {
  AppState, Cuenta, Deuda, Fase, Distribucion,
  TarjetaCredito, Prestamo, ClasificacionTasa,
  DeudaRanking, ObjetivoDinamico, HealthScore,
} from "./types";

// ─── V1 Functions (unchanged signatures) ──────────────────────────────────

export function calcularPatrimonioNeto(cuentas: Cuenta[], deudas: Deuda[]): number {
  const activos = cuentas.reduce((s, c) => s + c.balance, 0);
  const pasivos = deudas.reduce((s, d) => s + d.balance, 0);
  return activos - pasivos;
}

export function calcularLiquidezProtegida(cuentas: Cuenta[]): number {
  return cuentas.filter((c) => c.tipo === "meta" || c.tipo === "puente").reduce((s, c) => s + c.balance, 0);
}

export function calcularLiquidezDisponible(cuentas: Cuenta[]): number {
  return cuentas.filter((c) => c.tipo === "operativa" || c.tipo === "efectivo").reduce((s, c) => s + c.balance, 0);
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

export function calcularNivel(liquidezProtegida: number): { nivel: number; nombre: string; min: number; max: number } {
  const niveles = [
    { nivel: 1, nombre: "Fundador",     min: 0,          max: 50_000 },
    { nivel: 2, nombre: "Estable",      min: 50_000,     max: 100_000 },
    { nivel: 3, nombre: "Constructor",  min: 100_000,    max: 250_000 },
    { nivel: 4, nombre: "Acumulador",   min: 250_000,    max: 1_000_000 },
    { nivel: 5, nombre: "Inversionista",min: 1_000_000,  max: 5_000_000 },
    { nivel: 6, nombre: "Libre",        min: 5_000_000,  max: 10_000_000 },
    { nivel: 7, nombre: "Patrimonial",  min: 10_000_000, max: Infinity },
  ];
  return niveles.find((n) => liquidezProtegida >= n.min && liquidezProtegida < n.max) ?? niveles[0];
}

export function calcularProgreso(valor: number, meta: number): number {
  return Math.min(100, Math.max(0, (valor / meta) * 100));
}

export function calcularFechaEstimada(
  patrimonioNeto: number, meta: number, ingresoMensualEstimado = 150_000, tasaAhorro = 0.3
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
  monto: number, fase: Fase, esExtraordinario: boolean, hayCompromisos: boolean
): Distribucion[] {
  if (esExtraordinario && !hayCompromisos) {
    return [
      { categoria: "Patrimonio / Inmueble Futuro", porcentaje: 40, monto: monto * 0.4, destino: "Qik Patrimonio", color: "#1a1a2e" },
      { categoria: "Fondo Emergencia",             porcentaje: 15, monto: monto * 0.15, destino: "Qik Emergencia", color: "#3498db" },
      { categoria: "Tarjetas / Deudas",            porcentaje: 15, monto: monto * 0.15, destino: "Banreservas Principal", color: "#e74c3c" },
      { categoria: "Vida / Operativo",             porcentaje: 20, monto: monto * 0.2,  destino: "Banreservas Principal", color: "#2ecc71" },
      { categoria: "Disfrute / Recompensa",        porcentaje: 10, monto: monto * 0.1,  destino: "Qik Disfrute", color: "#f39c12" },
    ];
  }
  if (fase === 1) {
    return [
      { categoria: "Estabilidad / Patrimonio", porcentaje: 30, monto: monto * 0.3, destino: "Qik Emergencia+Patrimonio", color: "#1a1a2e" },
      { categoria: "Tarjetas",                 porcentaje: 20, monto: monto * 0.2, destino: "Tarjeta Banreservas", color: "#e74c3c" },
      { categoria: "Vehículo / Compromisos",   porcentaje: 10, monto: monto * 0.1, destino: "Qik Vehículo", color: "#8e44ad" },
      { categoria: "Vida / Operativo",         porcentaje: 30, monto: monto * 0.3, destino: "Banreservas Principal", color: "#2ecc71" },
      { categoria: "Disfrute",                 porcentaje: 10, monto: monto * 0.1, destino: "Qik Disfrute", color: "#f39c12" },
    ];
  }
  if (fase === 2) {
    return [
      { categoria: "Patrimonio",       porcentaje: 30, monto: monto * 0.3, destino: "Qik Patrimonio", color: "#1a1a2e" },
      { categoria: "Emergencia",       porcentaje: 10, monto: monto * 0.1, destino: "Qik Emergencia", color: "#3498db" },
      { categoria: "Compromisos",      porcentaje: 20, monto: monto * 0.2, destino: "Deudas / Vehículo", color: "#e74c3c" },
      { categoria: "Vida / Operativo", porcentaje: 30, monto: monto * 0.3, destino: "Banreservas Principal", color: "#2ecc71" },
      { categoria: "Disfrute",         porcentaje: 10, monto: monto * 0.1, destino: "Qik Disfrute", color: "#f39c12" },
    ];
  }
  return [
    { categoria: "Inversión / Patrimonio", porcentaje: 30, monto: monto * 0.3, destino: "Qik Patrimonio", color: "#1a1a2e" },
    { categoria: "Inmueble Futuro",        porcentaje: 10, monto: monto * 0.1, destino: "Qik Inmueble Futuro", color: "#16213e" },
    { categoria: "Oportunidades",          porcentaje: 10, monto: monto * 0.1, destino: "Popular / Inversión", color: "#2980b9" },
    { categoria: "Vida / Operativo",       porcentaje: 35, monto: monto * 0.35, destino: "Banreservas Principal", color: "#2ecc71" },
    { categoria: "Disfrute",               porcentaje: 15, monto: monto * 0.15, destino: "Qik Disfrute", color: "#f39c12" },
  ];
}

export function sugerirEfectivo(monto: number): { depositar: number; conservar: number; razon: string } {
  const pct = monto >= 50_000 ? 0.7 : 0.6;
  return {
    depositar: Math.round(monto * pct),
    conservar: Math.round(monto * (1 - pct)),
    razon: "Para gastos inmediatos de los próximos 3-5 días",
  };
}

export function generarMensajeAdvisor(state: AppState, contexto?: "ingreso" | "logro" | "alerta"): string {
  const fase = determinarFaseV2(state);
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

// ─── V2 Functions ─────────────────────────────────────────────────────────

export function clasificarTasa(tasa: number): ClasificacionTasa {
  if (tasa === 0) return "verde";
  if (tasa < 10) return "verde";
  if (tasa < 20) return "amarillo";
  if (tasa < 40) return "rojo";
  return "critico";
}

export const TASA_COLORS: Record<ClasificacionTasa, string> = {
  verde:   "#27ae60",
  amarillo:"#f39c12",
  rojo:    "#e74c3c",
  critico: "#8e44ad",
};

export function calcularUtilizacionTarjeta(t: TarjetaCredito): number {
  return t.limiteDOP > 0 ? (t.balanceActualDOP / t.limiteDOP) * 100 : 0;
}

export function calcularUtilizacionTotal(tarjetas: TarjetaCredito[]): number {
  const activas = tarjetas.filter((t) => t.activa);
  if (activas.length === 0) return 0;
  const totalLimite = activas.reduce((s, t) => s + t.limiteDOP, 0);
  const totalBalance = activas.reduce((s, t) => s + t.balanceActualDOP, 0);
  return totalLimite > 0 ? (totalBalance / totalLimite) * 100 : 0;
}

export function calcularTotalPasivos(state: AppState): number {
  const tarjetas = state.tarjetas ?? [];
  const prestamos = state.prestamos ?? [];
  const tarjetasTotal = tarjetas.filter((t) => t.activa).reduce((s, t) => s + t.balanceActualDOP, 0);
  const prestamosTotal = prestamos.filter((p) => p.activo).reduce((s, p) => s + p.balancePendiente, 0);
  const newTotal = tarjetasTotal + prestamosTotal;
  // Use new product types when available, else fall back to legacy deudas
  if (tarjetas.length > 0 || prestamos.length > 0) return newTotal;
  return calcularTotalDeudas(state.deudas);
}

export function calcularPatrimonioNetoV2(state: AppState): number {
  const activosCuentas = state.cuentas.reduce((s, c) => s + c.balance, 0);
  const activosInversiones = (state.inversiones ?? []).reduce((s, i) => s + i.balanceActual, 0);
  const activosMetasAhorro = (state.metasAhorro ?? []).reduce((s, m) => s + m.balanceActual, 0);
  const pasivos = calcularTotalPasivos(state);
  return activosCuentas + activosInversiones + activosMetasAhorro - pasivos;
}

export function calcularEfectivoTotal(cuentas: Cuenta[]): number {
  return cuentas.reduce((s, c) => s + c.balance, 0);
}

export function calcularPatrimonioAcumulado(state: AppState): number {
  const metasQik = state.cuentas.filter((c) => c.tipo === "meta").reduce((s, c) => s + c.balance, 0);
  const inversiones = (state.inversiones ?? []).reduce((s, i) => s + i.balanceActual, 0);
  return metasQik + inversiones;
}

export function determinarFaseV2(state: AppState): Fase {
  const liquidez = calcularLiquidezProtegida(state.cuentas);
  const tarjetas = state.tarjetas ?? [];
  if (tarjetas.length > 0) {
    const totalTarjetas = tarjetas.filter((t) => t.activa).reduce((s, t) => s + t.balanceActualDOP, 0);
    if (liquidez >= 200_000 && totalTarjetas < 50_000) return 3;
    if (liquidez >= 100_000 && totalTarjetas < 100_000) return 2;
    return 1;
  }
  return determinarFase(state.cuentas, state.deudas);
}

export function calcularHealthScore(state: AppState): HealthScore {
  const liquidez = calcularLiquidezProtegida(state.cuentas);
  const tarjetas = state.tarjetas ?? [];
  const prestamos = state.prestamos ?? [];

  // Factor 1: Liquidez (0-20)
  let pLiquidez = 0;
  if (liquidez >= 200_000) pLiquidez = 20;
  else if (liquidez >= 100_000) pLiquidez = 15;
  else if (liquidez >= 50_000) pLiquidez = 10;
  else if (liquidez >= 25_000) pLiquidez = 5;

  // Factor 2: Utilización tarjetas (0-20)
  let pTarjetas = 20;
  if (tarjetas.length > 0) {
    const util = calcularUtilizacionTotal(tarjetas);
    if (util >= 85) pTarjetas = 0;
    else if (util >= 70) pTarjetas = 5;
    else if (util >= 50) pTarjetas = 10;
    else if (util >= 30) pTarjetas = 15;
    else pTarjetas = 20;
  } else {
    pTarjetas = 10; // neutral if no tarjeta data
  }

  // Factor 3: Carga deuda vs ingresos (0-20)
  const ingresoMensual = 150_000;
  const cuotaTotal = tarjetas.filter((t) => t.activa).reduce((s, t) => s + t.pagoMinimoDOP, 0)
    + prestamos.filter((p) => p.activo).reduce((s, p) => s + p.cuotaMensual, 0)
    + state.deudas.reduce((s, d) => s + d.pagoMensual, 0);
  const ratioCuota = cuotaTotal / ingresoMensual;
  let pDeuda = 0;
  if (ratioCuota < 0.15) pDeuda = 20;
  else if (ratioCuota < 0.25) pDeuda = 15;
  else if (ratioCuota < 0.35) pDeuda = 10;
  else if (ratioCuota < 0.5) pDeuda = 5;

  // Factor 4: Tasa de captura (0-20) — estimate from recent ingresos
  let pCaptura = 10;
  const ingresosMes = state.ingresos.filter((i) => {
    const f = new Date(i.fecha);
    const now = new Date();
    return f.getMonth() === now.getMonth() && f.getFullYear() === now.getFullYear();
  });
  if (ingresosMes.length > 0) {
    const totalMes = ingresosMes.reduce((s, i) => s + i.monto, 0);
    const capturados = ingresosMes.filter((i) => i.esExtraordinario || i.origen === "honorarios");
    const tasaCaptura = capturados.length / ingresosMes.length;
    if (tasaCaptura >= 0.8) pCaptura = 20;
    else if (tasaCaptura >= 0.5) pCaptura = 15;
    else if (totalMes > 0) pCaptura = 10;
  }

  // Factor 5: Progreso patrimonial (0-20)
  const patrimonio = calcularPatrimonioNetoV2(state);
  const progresoPct = patrimonio / state.metaFinal;
  let pPatrimonio = 0;
  if (progresoPct >= 0.2) pPatrimonio = 20;
  else if (progresoPct >= 0.05) pPatrimonio = 15;
  else if (progresoPct >= 0.01) pPatrimonio = 10;
  else if (progresoPct > 0) pPatrimonio = 5;

  const score = pLiquidez + pTarjetas + pDeuda + pCaptura + pPatrimonio;
  let clasificacion: HealthScore["clasificacion"];
  let color: string;
  if (score >= 81) { clasificacion = "Fuerte"; color = "#27ae60"; }
  else if (score >= 61) { clasificacion = "Estable"; color = "#2ecc71"; }
  else if (score >= 41) { clasificacion = "Vulnerable"; color = "#f39c12"; }
  else { clasificacion = "Crítico"; color = "#e74c3c"; }

  return {
    score,
    clasificacion,
    color,
    factores: { liquidez: pLiquidez, tarjetas: pTarjetas, deuda: pDeuda, captura: pCaptura, patrimonio: pPatrimonio },
  };
}

export function calcularObjetivoDinamico(state: AppState): ObjetivoDinamico {
  const liquidez = calcularLiquidezProtegida(state.cuentas);
  const patrimonio = calcularPatrimonioNetoV2(state);
  const tarjetas = state.tarjetas ?? [];

  if (liquidez < 50_000) return {
    label: "RD$50,000 protegidos",
    actual: liquidez, meta: 50_000, tipo: "liquidez",
    detalle: "Primer escudo financiero – sin esto no hay construcción real",
  };

  if (liquidez < 100_000) return {
    label: "RD$100,000 protegidos",
    actual: liquidez, meta: 100_000, tipo: "liquidez",
    detalle: "Fondo de emergencia básico – 3 meses de respaldo",
  };

  const principal = tarjetas.find((t) => t.banco === "Banreservas");
  if (principal && principal.limiteDOP > 0 && (principal.balanceActualDOP / principal.limiteDOP) > 0.5) {
    const metaTarjeta = principal.limiteDOP * 0.5;
    return {
      label: `Tarjeta ${principal.nombre} bajo 50%`,
      actual: metaTarjeta - (principal.balanceActualDOP - metaTarjeta),
      meta: metaTarjeta, tipo: "tarjeta",
      detalle: "Reducir utilización libera flujo de caja y baja costo de deuda",
    };
  }

  for (const hito of [250_000, 500_000, 1_000_000, 5_000_000, 10_000_000]) {
    if (patrimonio < hito) return {
      label: `RD$${hito >= 1_000_000 ? (hito / 1_000_000) + "M" : (hito / 1_000) + "K"} patrimonio`,
      actual: Math.max(0, patrimonio),
      meta: hito, tipo: "patrimonio",
      detalle: "Siguiente hito en la ruta hacia RD$10,000,000",
    };
  }

  return {
    label: "Meta Final RD$10,000,000",
    actual: Math.max(0, patrimonio), meta: 10_000_000,
    tipo: "patrimonio", detalle: "Libertad financiera total",
  };
}

export function calcularRankingDeudas(state: AppState): DeudaRanking[] {
  const items: DeudaRanking[] = [];

  for (const t of state.tarjetas ?? []) {
    if (!t.activa) continue;
    const util = calcularUtilizacionTarjeta(t);
    const clsTasa = clasificarTasa(t.tasaAnual);
    let prioridad: DeudaRanking["prioridad"];
    let razon = "";
    if (t.tasaAnual > 40 || util > 80) {
      prioridad = "critica";
      razon = t.tasaAnual > 40 ? `Tasa ${t.tasaAnual}% – deuda más costosa del portafolio` : `Utilización ${util.toFixed(0)}% – crédito en zona de riesgo`;
    } else if (t.tasaAnual > 20 || util > 60) {
      prioridad = "alta";
      razon = `Tasa ${t.tasaAnual}% + utilización ${util.toFixed(0)}%`;
    } else if (t.tasaAnual > 10 || util > 40) {
      prioridad = "media";
      razon = "Mantener vigilancia y reducir gradualmente";
    } else {
      prioridad = "baja";
      razon = "Controlada";
    }
    items.push({ id: t.id, nombre: t.nombre, tipo: "tarjeta", balance: t.balanceActualDOP, cuotaMensual: t.pagoMinimoDOP, tasaAnual: t.tasaAnual, utilizacion: util, prioridad, razon, clasificacionTasa: clsTasa });
  }

  for (const p of state.prestamos ?? []) {
    if (!p.activo) continue;
    const clsTasa = clasificarTasa(p.tasaAnual);
    let prioridad: DeudaRanking["prioridad"];
    let razon = "";
    if (p.tasaAnual > 40) { prioridad = "critica"; razon = `Tasa ${p.tasaAnual}% – reducir urgente`; }
    else if (p.tasaAnual > 20) { prioridad = "alta"; razon = `Tasa ${p.tasaAnual}% – costosa`; }
    else if (p.tasaAnual > 10) { prioridad = "media"; razon = `Tasa ${p.tasaAnual}% – manejable`; }
    else { prioridad = "baja"; razon = `Tasa ${p.tasaAnual}% – razonable`; }
    items.push({ id: p.id, nombre: p.nombre, tipo: "prestamo", balance: p.balancePendiente, cuotaMensual: p.cuotaMensual, tasaAnual: p.tasaAnual, prioridad, razon, clasificacionTasa: clsTasa });
  }

  for (const d of state.deudas) {
    const clsTasa = clasificarTasa(d.tasa ?? 0);
    let prioridad: DeudaRanking["prioridad"] = d.prioridad === "alta" ? "alta" : d.prioridad === "media" ? "media" : "baja";
    items.push({ id: d.id, nombre: d.nombre, tipo: "deuda", balance: d.balance, cuotaMensual: d.pagoMensual, tasaAnual: d.tasa ?? 0, prioridad, razon: d.tasa ? `Tasa estimada ${d.tasa}%` : "Tasa no registrada", clasificacionTasa: clsTasa });
  }

  const order = { critica: 0, alta: 1, media: 2, baja: 3 };
  return items.sort((a, b) => order[a.prioridad] - order[b.prioridad]);
}

export function calcularMetricasMes(state: AppState): {
  ingresosMes: number;
  ingresosUlt3: number;
  ingresosUlt12: number;
  tasaCapturaMes: number;
  cantidadIngresosMes: number;
} {
  const now = new Date();
  const getMonth = (d: Date) => d.getFullYear() * 12 + d.getMonth();

  const ingresosMes = state.ingresos.filter((i) => {
    const f = new Date(i.fecha);
    return getMonth(f) === getMonth(now);
  });

  const ingresosUlt3 = state.ingresos.filter((i) => {
    const f = new Date(i.fecha);
    const diff = getMonth(now) - getMonth(f);
    return diff >= 0 && diff < 3;
  });

  const ingresosUlt12 = state.ingresos.filter((i) => {
    const f = new Date(i.fecha);
    const diff = getMonth(now) - getMonth(f);
    return diff >= 0 && diff < 12;
  });

  const totalMes = ingresosMes.reduce((s, i) => s + i.monto, 0);
  const total3 = ingresosUlt3.reduce((s, i) => s + i.monto, 0);
  const total12 = ingresosUlt12.reduce((s, i) => s + i.monto, 0);

  // Tasa captura: % del ingreso asignado a patrimonio/metas (rough estimate from extraordinary flag)
  const tasaCaptura = ingresosMes.length > 0
    ? ingresosMes.filter((i) => i.esExtraordinario || i.origen === "honorarios").length / ingresosMes.length * 100
    : 0;

  return {
    ingresosMes: totalMes,
    ingresosUlt3: ingresosUlt3.length >= 3 ? total3 / 3 : total3 / Math.max(1, ingresosUlt3.length),
    ingresosUlt12: ingresosUlt12.length >= 12 ? total12 / 12 : total12 / Math.max(1, ingresosUlt12.length),
    tasaCapturaMes: tasaCaptura,
    cantidadIngresosMes: ingresosMes.length,
  };
}

export function diasHastaFecha(dia: number): number {
  const hoy = new Date();
  const mes = hoy.getDate() > dia ? hoy.getMonth() + 1 : hoy.getMonth();
  const target = new Date(hoy.getFullYear(), mes, dia);
  return Math.ceil((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function costoAnualEstimado(balance: number, tasaAnual: number): number {
  return balance * (tasaAnual / 100);
}
