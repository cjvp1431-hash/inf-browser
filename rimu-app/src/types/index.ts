// ── Central type definitions for RIMU App ────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: number; // 1=Urgente+Importante  2=Importante  3=Urgente  4=Eliminar
  status: 'pending' | 'in_progress' | 'completed' | 'archived';
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  currentStreak: number;
  longestStreak: number;
  completedDates: string[];
  createdAt: string;
}

export interface Workout {
  id: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  date: string;
  notes: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  currency: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  description: string;
  date: string;
  installments: number;
  installmentNumber: number;
  totalInstallments: number;
  createdAt: string;
}

export interface Budget {
  id: string;
  accountId: string;
  category: string;
  limitAmount: number;
  period: 'monthly' | 'weekly';
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName?: string;
  date: string;
  duration: number; // minutes
  focusType: 'pomodoro' | 'focused' | 'review';
  notes: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: string;
  actionType?: string;
}

export type ParseType = 'income' | 'expense' | 'workout' | 'task' | 'study' | 'habit' | 'help' | 'unknown';

export interface ParseResult {
  type: ParseType;
  data: Record<string, any> | null;
  botResponse: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  color: string;
}

export type TaskView = 'list' | 'kanban' | 'timeline';
export type TaskFilter = 'all' | 'pending' | 'in_progress' | 'completed';
