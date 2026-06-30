export const COLORS = {
  primary: '#0A0A0A',
  accent: '#00D4FF',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceDark: '#E8E8E8',
  textPrimary: '#0A0A0A',
  textSecondary: '#666666',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  border: '#E0E0E0',
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Urgente + Importante',
  2: 'Importante',
  3: 'Urgente',
  4: 'Eliminar',
};

export const PRIORITY_COLORS: Record<number, string> = {
  1: '#F44336',
  2: '#FF9800',
  3: '#2196F3',
  4: '#9E9E9E',
};

export const TASK_CATEGORIES = [
  'Personal', 'Trabajo', 'Salud', 'Finanzas', 'Estudio', 'Hogar', 'Otro',
];

export const EXPENSE_CATEGORIES = [
  'Comida', 'Transporte', 'Suscripción', 'Salud', 'Entretenimiento', 'Ropa', 'Otro',
];

export const INCOME_CATEGORIES = [
  'Salario', 'Freelance', 'Inversión', 'Regalo', 'Otro',
];

export const CURRENCIES = ['USD', 'DOP', 'EUR', 'MXN', 'COP', 'ARS', 'PEN', 'CLP'];

export const WEIGHT_UNITS = ['kg', 'lbs'];

export const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
export const SHORT_BREAK = 5 * 60;
export const LONG_BREAK = 15 * 60;

export const SUBJECT_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#00BCD4', '#009688',
  '#4CAF50', '#CDDC39', '#FFC107', '#FF5722',
];
