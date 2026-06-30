import { ParseResult } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const extractAmount = (text: string): number => {
  const match = text.match(/\$?\s*(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{1,2})?)\b/);
  if (!match) return 0;
  // Normalize: if last separator followed by exactly 2 digits → decimal, else thousands
  const raw = match[1];
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
  return parseFloat(normalized) || 0;
};

const extractMinutes = (text: string): number => {
  let total = 0;
  const h = text.match(/(\d+(?:\.\d+)?)\s*h(?:ora)?s?/);
  const m = text.match(/(\d+)\s*min(?:utos?)?/);
  if (h) total += parseFloat(h[1]) * 60;
  if (m) total += parseInt(m[1]);
  return Math.round(total);
};

const CATEGORY_MAP: Record<string, string> = {
  comida: 'Comida', comi: 'Comida', restaurante: 'Comida', almuerzo: 'Comida',
  desayuno: 'Comida', cena: 'Comida', pizza: 'Comida', colmado: 'Comida',
  transporte: 'Transporte', taxi: 'Transporte', uber: 'Transporte',
  gasolina: 'Transporte', metro: 'Transporte', guagua: 'Transporte',
  salud: 'Salud', medico: 'Salud', farmacia: 'Salud', doctor: 'Salud', clinica: 'Salud',
  ropa: 'Ropa', zapatos: 'Ropa', vestido: 'Ropa',
  netflix: 'Suscripción', spotify: 'Suscripción', suscripcion: 'Suscripción', streaming: 'Suscripción',
  cine: 'Entretenimiento', pelicula: 'Entretenimiento', concierto: 'Entretenimiento',
  educacion: 'Educación', libro: 'Educación', curso: 'Educación', matricula: 'Educación',
};

const detectExpenseCategory = (text: string): string => {
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(kw)) return cat;
  }
  return 'Otro';
};

const EXERCISES = [
  'bench press', 'press de banca', 'press banca',
  'sentadilla', 'squat',
  'peso muerto', 'deadlift',
  'curl de bicep', 'curl bicep', 'curl',
  'press militar', 'overhead press',
  'remo con barra', 'remo',
  'dominadas', 'pull up',
  'fondos', 'dips',
  'extension tricep', 'tricep',
  'leg press',
  'cardio', 'correr', 'bicicleta', 'eliptica',
  'yoga', 'pilates',
];

const detectExercise = (text: string): string => {
  for (const ex of EXERCISES) {
    if (text.includes(ex)) return ex.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return 'Entrenamiento';
};

// ── Main Parser ───────────────────────────────────────────────────────────────

export const parseWhatsAppMessage = (message: string): ParseResult => {
  const lower = message.toLowerCase().trim();

  // ── HELP ──────────────────────────────────────────────────────────────────
  if (/ayuda|help|comandos|qu[eé]\s+puedo|qu[eé]\s+haces/.test(lower)) {
    return {
      type: 'help',
      data: null,
      botResponse:
        '🤖 *RIMU Bot – Comandos disponibles:*\n\n' +
        '💰 *Ingreso:* "Gané 50,000 pesos"\n' +
        '💸 *Gasto:* "Gasté 1,500 en comida"\n' +
        '💪 *Ejercicio:* "Hice bench press 100kg 4x8"\n' +
        '📋 *Tarea:* "Dentista mañana a las 3pm"\n' +
        '📚 *Estudio:* "Estudié 2 horas de derecho"\n' +
        '🔥 *Hábito:* "Medité hoy"\n\n' +
        'Puedo crear registros directamente desde el chat!',
    };
  }

  // ── INCOME ────────────────────────────────────────────────────────────────
  if (/gan[eé]|recib[ií]|cobr[eé]|me\s+pagaron|ingres[eé]|salar[ií]|deposi/.test(lower)) {
    const amount = extractAmount(lower);
    const isUSD = /d[oó]lar|usd|\$/.test(lower) && !/peso|dop/.test(lower);
    if (amount > 0) {
      const cat = /salari|sueldo|pag[oó]/.test(lower)
        ? 'Salario'
        : /freelance|servicio|trabajo/.test(lower)
        ? 'Freelance'
        : 'Otro';
      return {
        type: 'income',
        data: { amount, currency: isUSD ? 'USD' : 'DOP', category: cat, description: message },
        botResponse: `✅ Ingreso registrado: ${isUSD ? '$' : 'RD$'}${amount.toLocaleString('es-DO')} (${cat})`,
      };
    }
  }

  // ── EXPENSE ───────────────────────────────────────────────────────────────
  if (/gast[eé]|pagu[eé]|compr[eé]|me\s+cost[oó]|sali[oó]\s+|invert[ií]|desembols/.test(lower)) {
    const amount = extractAmount(lower);
    const category = detectExpenseCategory(lower);
    if (amount > 0) {
      return {
        type: 'expense',
        data: { amount, category, description: message },
        botResponse: `✅ Gasto registrado: RD$${amount.toLocaleString('es-DO')} en ${category}`,
      };
    }
  }

  // ── WORKOUT ───────────────────────────────────────────────────────────────
  const workoutTrigger =
    /entrené|hice\s+(?:gym|ejercicio|cardio|yoga|pilates)|fui\s+al\s+gym|levanté|press|squat|sentadilla|peso\s+muerto|deadlift|curl|remo|dominadas|fondos|corrí|caminé/.test(
      lower
    );
  if (workoutTrigger) {
    const exerciseName = detectExercise(lower);
    const setsMatch = lower.match(/(\d+)\s*(?:x|×|series|sets)\s*/);
    const repsMatch = lower.match(/(?:x|×)\s*(\d+)|(\d+)\s*(?:reps|repeticiones)/);
    const weightMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?)/);
    const minutesMatch = lower.match(/(\d+)\s*min/);

    return {
      type: 'workout',
      data: {
        exerciseName,
        sets: setsMatch ? parseInt(setsMatch[1]) : minutesMatch ? 1 : 3,
        reps: repsMatch ? parseInt(repsMatch[1] ?? repsMatch[2]) : minutesMatch ? parseInt(minutesMatch[1]) : 10,
        weight: weightMatch ? parseFloat(weightMatch[1]) : 0,
        weightUnit: 'kg',
        notes: message,
      },
      botResponse: `💪 Entrenamiento registrado: ${exerciseName}${weightMatch ? ` – ${weightMatch[1]}kg` : ''}`,
    };
  }

  // ── STUDY ─────────────────────────────────────────────────────────────────
  if (/estudi[eé]|repas[eé]|apren[dD][ií]|le[ií]\s+sobre|pratic[qué]|revis[eé]/.test(lower)) {
    const duration = extractMinutes(lower) || 30;
    const subjectMatch = lower.match(
      /(?:de|sobre|para|el|la)\s+([a-záéíóúüñ][a-záéíóúüñ\s]{2,30?}?)(?:\s+por|\s*$|\s+hoy)/
    );
    return {
      type: 'study',
      data: {
        duration,
        subjectHint: subjectMatch ? subjectMatch[1].trim() : '',
        notes: message,
        focusType: lower.includes('repas') ? 'review' : 'focused',
      },
      botResponse: `📚 Sesión registrada: ${duration}min${subjectMatch ? ` de ${subjectMatch[1].trim()}` : ''}`,
    };
  }

  // ── TASK ──────────────────────────────────────────────────────────────────
  if (
    /tengo que|recordar|cita|reuni[oó]n|llamar a|enviar|dentista|m[eé]dico|ir a|visita|entregar|presentar|audiencia|comparecer/.test(
      lower
    )
  ) {
    const hasTomorrow = /ma[nñ]ana|tomorrow/.test(lower);
    const hasNext = /pr[oó]ximo|la pr[oó]xima|siguiente/.test(lower);
    const timeMatch = lower.match(/(?:a\s+las?|at)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/);
    const dueDate = new Date();
    if (hasTomorrow) dueDate.setDate(dueDate.getDate() + 1);
    else if (hasNext) dueDate.setDate(dueDate.getDate() + 7);

    return {
      type: 'task',
      data: {
        title: message.replace(/(?:ma[nñ]ana|a\s+las?\s*\d+[:.]\d*(?:\s*[ap]m)?|hoy)/gi, '').trim(),
        dueDate: dueDate.toISOString().split('T')[0],
        priority: /urgent|urgente|importante|prioridad/.test(lower) ? 1 : 2,
        category: /trabajo|reuni[oó]n|cliente|audiencia|tribunal/.test(lower) ? 'Trabajo' : 'Personal',
        description: timeMatch ? `Hora: ${timeMatch[1]}${timeMatch[2] ? ' ' + timeMatch[2] : ''}` : '',
      },
      botResponse: `📋 Tarea creada: "${message.substring(0, 40)}${message.length > 40 ? '...' : ''}"`,
    };
  }

  // ── HABIT CHECK-IN ────────────────────────────────────────────────────────
  if (
    /medité|hice\s+yoga|yoga|le[ií]\s+hoy|le[ií]\s+el|hice\s+ejercicio|corrí\s+hoy|caminé\s+hoy|tomé\s+agua|dormí\s+bien|fui\s+al\s+gym/.test(
      lower
    )
  ) {
    const habitHint = lower.includes('yoga')
      ? 'yoga'
      : lower.includes('medité') || lower.includes('meditación')
      ? 'meditar'
      : lower.includes('le[ií]')
      ? 'leer'
      : lower.includes('corrí') || lower.includes('ejercicio')
      ? 'ejercitar'
      : 'hábito';
    return {
      type: 'habit',
      data: { hint: habitHint },
      botResponse: `🔥 ¡Check-in de hábito registrado! Selecciona cuál hábito en la pantalla de Hábitos.`,
    };
  }

  // ── UNKNOWN ───────────────────────────────────────────────────────────────
  return {
    type: 'unknown',
    data: null,
    botResponse: `🤔 No entendí ese mensaje. Escribe *ayuda* para ver los comandos disponibles.`,
  };
};
