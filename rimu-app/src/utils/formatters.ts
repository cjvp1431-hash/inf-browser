export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

export const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '€', DOP: 'RD$', MXN: 'MX$',
    COP: 'COL$', ARS: 'AR$', PEN: 'S/', CLP: 'CL$',
  };
  const symbol = symbols[currency] || currency;
  return `${symbol}${Math.abs(amount).toFixed(2)}`;
};

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

export const formatTimerSeconds = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const isSameDay = (date1: string, date2: string): boolean => {
  return date1.split('T')[0] === date2.split('T')[0];
};

export const calculateStreak = (completedDates: string[]): number => {
  if (!completedDates.length) return 0;
  const sorted = [...completedDates].sort((a, b) => b.localeCompare(a));
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (sorted[0] !== today && sorted[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const curr = new Date(sorted[i - 1]);
    curr.setDate(curr.getDate() - 1);
    const expected = curr.toISOString().split('T')[0];
    if (sorted[i] === expected) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};
