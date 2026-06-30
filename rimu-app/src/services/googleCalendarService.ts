import { CalendarEvent, Task } from '../types';

// ── Simulated Google Calendar Events ─────────────────────────────────────────
// In a real integration you would use the Google Calendar API with OAuth.
// Here we provide static demo events + export helpers.

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

export const getSimulatedEvents = (): CalendarEvent[] => [
  {
    id: 'cal-1',
    title: 'Audiencia Tribunal Civil',
    date: fmt(addDays(today, 1)),
    time: '10:00',
    location: 'Tribunal de Primera Instancia, Sto. Dgo.',
    notes: 'Llevar expediente completo y constancias anotadas.',
    color: '#F44336',
  },
  {
    id: 'cal-2',
    title: 'Reunión con cliente – Deslinde',
    date: fmt(addDays(today, 2)),
    time: '14:30',
    location: 'Oficina',
    notes: 'Revisar planos antes de la reunión.',
    color: '#2196F3',
  },
  {
    id: 'cal-3',
    title: 'Vencimiento de recurso de apelación',
    date: fmt(addDays(today, 3)),
    time: '17:00',
    color: '#FF9800',
  },
  {
    id: 'cal-4',
    title: 'Entrega de informe mensual',
    date: fmt(addDays(today, 5)),
    time: '09:00',
    color: '#9C27B0',
  },
  {
    id: 'cal-5',
    title: 'Consulta médica',
    date: fmt(addDays(today, 7)),
    time: '11:00',
    location: 'Clínica Abreu',
    color: '#4CAF50',
  },
];

export const exportTaskToCalendarText = (task: Task): string => {
  const lines = [
    `📅 EVENTO PARA GOOGLE CALENDAR`,
    `Título: ${task.title}`,
    task.dueDate ? `Fecha: ${task.dueDate}` : '',
    task.description ? `Descripción: ${task.description}` : '',
    `Categoría: ${task.category}`,
    `(Copia este texto y pégalo en Google Calendar)`,
  ];
  return lines.filter(Boolean).join('\n');
};

export const tasksToCalendarEvents = (tasks: Task[]): CalendarEvent[] =>
  tasks
    .filter(t => t.status !== 'completed' && t.dueDate)
    .map(t => ({
      id: t.id,
      title: t.title,
      date: t.dueDate,
      time: '09:00',
      notes: t.description,
      color: t.priority === 1 ? '#F44336' : t.priority === 2 ? '#FF9800' : '#2196F3',
    }));
