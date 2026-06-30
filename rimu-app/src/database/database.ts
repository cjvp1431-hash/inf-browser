import * as SQLite from 'expo-sqlite';
import { generateId, getTodayString } from '../utils/formatters';
import { calculateStreak } from '../utils/formatters';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: number;
  status: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: string;
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
  weightUnit: string;
  date: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  installments: number;
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
  duration: number;
  focusType: string;
  createdAt: string;
}

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = (): SQLite.SQLiteDatabase => {
  if (!db) throw new Error('Database not initialized');
  return db;
};

export const initDatabase = async (): Promise<void> => {
  db = await SQLite.openDatabaseAsync('rimu.db');

  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      dueDate TEXT DEFAULT '',
      priority INTEGER DEFAULT 2,
      status TEXT DEFAULT 'pending',
      category TEXT DEFAULT 'Personal',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      frequency TEXT DEFAULT 'daily',
      currentStreak INTEGER DEFAULT 0,
      longestStreak INTEGER DEFAULT 0,
      completedDates TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      exerciseName TEXT NOT NULL,
      sets INTEGER DEFAULT 3,
      reps INTEGER DEFAULT 10,
      weight REAL DEFAULT 0,
      weightUnit TEXT DEFAULT 'kg',
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'checking',
      currency TEXT DEFAULT 'USD',
      balance REAL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'Otro',
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      installments INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#2196F3',
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS studySessions (
      id TEXT PRIMARY KEY,
      subjectId TEXT NOT NULL,
      date TEXT NOT NULL,
      duration INTEGER DEFAULT 25,
      focusType TEXT DEFAULT 'pomodoro',
      createdAt TEXT NOT NULL
    );
  `);

  await seedInitialData();
};

const seedInitialData = async (): Promise<void> => {
  const d = getDB();
  const existing = await d.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM tasks');
  if (existing && existing.count > 0) return;

  const now = new Date().toISOString();
  const today = getTodayString();

  // Seed tasks
  const tasks = [
    { title: 'Preparar presentación del proyecto', category: 'Trabajo', priority: 1, dueDate: today },
    { title: 'Llamar al médico para cita', category: 'Salud', priority: 2, dueDate: today },
    { title: 'Comprar groceries', category: 'Hogar', priority: 3, dueDate: today },
  ];

  for (const t of tasks) {
    const id = generateId();
    await d.runAsync(
      'INSERT INTO tasks (id, title, description, dueDate, priority, status, category, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, t.title, '', t.dueDate, t.priority, 'pending', t.category, now, now]
    );
  }

  // Seed habits
  const habits = [
    { title: 'Meditar 10 minutos', frequency: 'daily' },
    { title: 'Leer 30 minutos', frequency: 'daily' },
  ];

  for (const h of habits) {
    const id = generateId();
    await d.runAsync(
      'INSERT INTO habits (id, title, frequency, currentStreak, longestStreak, completedDates, createdAt) VALUES (?,?,?,?,?,?,?)',
      [id, h.title, h.frequency, 0, 0, '[]', now]
    );
  }

  // Seed workout
  const wId = generateId();
  await d.runAsync(
    'INSERT INTO workouts (id, exerciseName, sets, reps, weight, weightUnit, date, createdAt) VALUES (?,?,?,?,?,?,?,?)',
    [wId, 'Press de Banca', 3, 10, 60, 'kg', today, now]
  );

  // Seed account
  const accId = generateId();
  await d.runAsync(
    'INSERT INTO accounts (id, name, type, currency, balance, createdAt) VALUES (?,?,?,?,?,?)',
    [accId, 'Cuenta Principal', 'checking', 'USD', 1000, now]
  );

  // Seed transaction
  const txId = generateId();
  await d.runAsync(
    'INSERT INTO transactions (id, accountId, type, amount, category, description, date, installments, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
    [txId, accId, 'expense', 50, 'Comida', 'Supermercado', today, 1, now]
  );

  // Seed subject
  const subjId = generateId();
  await d.runAsync(
    'INSERT INTO subjects (id, name, color, createdAt) VALUES (?,?,?,?)',
    [subjId, 'Inglés', '#2196F3', now]
  );
};

// ─── TASKS ───────────────────────────────────────────────────────────────────

export const getTasks = async (): Promise<Task[]> => {
  return getDB().getAllAsync<Task>('SELECT * FROM tasks ORDER BY createdAt DESC');
};

export const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const d = getDB();
  const id = generateId();
  const now = new Date().toISOString();
  await d.runAsync(
    'INSERT INTO tasks (id, title, description, dueDate, priority, status, category, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, task.title, task.description || '', task.dueDate || '', task.priority, task.status, task.category, now, now]
  );
  return { ...task, id, createdAt: now, updatedAt: now };
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  const d = getDB();
  const now = new Date().toISOString();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), now, id];
  await d.runAsync(`UPDATE tasks SET ${fields}, updatedAt = ? WHERE id = ?`, values);
};

export const deleteTask = async (id: string): Promise<void> => {
  await getDB().runAsync('DELETE FROM tasks WHERE id = ?', [id]);
};

// ─── HABITS ──────────────────────────────────────────────────────────────────

export const getHabits = async (): Promise<Habit[]> => {
  const rows = await getDB().getAllAsync<Omit<Habit, 'completedDates'> & { completedDates: string }>(
    'SELECT * FROM habits ORDER BY createdAt DESC'
  );
  return rows.map(r => ({
    ...r,
    completedDates: JSON.parse(r.completedDates || '[]'),
  }));
};

export const addHabit = async (habit: { title: string; frequency: string }): Promise<Habit> => {
  const d = getDB();
  const id = generateId();
  const now = new Date().toISOString();
  await d.runAsync(
    'INSERT INTO habits (id, title, frequency, currentStreak, longestStreak, completedDates, createdAt) VALUES (?,?,?,?,?,?,?)',
    [id, habit.title, habit.frequency, 0, 0, '[]', now]
  );
  return { id, title: habit.title, frequency: habit.frequency, currentStreak: 0, longestStreak: 0, completedDates: [], createdAt: now };
};

export const checkInHabit = async (id: string, currentDates: string[]): Promise<{ currentStreak: number; longestStreak: number; completedDates: string[] }> => {
  const d = getDB();
  const today = getTodayString();
  if (currentDates.includes(today)) {
    return { currentStreak: calculateStreak(currentDates), longestStreak: 0, completedDates: currentDates };
  }
  const newDates = [...currentDates, today];
  const newStreak = calculateStreak(newDates);
  const row = await d.getFirstAsync<{ longestStreak: number }>('SELECT longestStreak FROM habits WHERE id = ?', [id]);
  const newLongest = Math.max(row?.longestStreak || 0, newStreak);
  await d.runAsync(
    'UPDATE habits SET completedDates = ?, currentStreak = ?, longestStreak = ? WHERE id = ?',
    [JSON.stringify(newDates), newStreak, newLongest, id]
  );
  return { currentStreak: newStreak, longestStreak: newLongest, completedDates: newDates };
};

export const deleteHabit = async (id: string): Promise<void> => {
  await getDB().runAsync('DELETE FROM habits WHERE id = ?', [id]);
};

// ─── WORKOUTS ─────────────────────────────────────────────────────────────────

export const getWorkouts = async (): Promise<Workout[]> => {
  return getDB().getAllAsync<Workout>('SELECT * FROM workouts ORDER BY date DESC, createdAt DESC LIMIT 50');
};

export const addWorkout = async (workout: Omit<Workout, 'id' | 'createdAt'>): Promise<Workout> => {
  const d = getDB();
  const id = generateId();
  const now = new Date().toISOString();
  await d.runAsync(
    'INSERT INTO workouts (id, exerciseName, sets, reps, weight, weightUnit, date, createdAt) VALUES (?,?,?,?,?,?,?,?)',
    [id, workout.exerciseName, workout.sets, workout.reps, workout.weight, workout.weightUnit, workout.date, now]
  );
  return { ...workout, id, createdAt: now };
};

export const deleteWorkout = async (id: string): Promise<void> => {
  await getDB().runAsync('DELETE FROM workouts WHERE id = ?', [id]);
};

// ─── FINANCE ──────────────────────────────────────────────────────────────────

export const getAccounts = async (): Promise<Account[]> => {
  return getDB().getAllAsync<Account>('SELECT * FROM accounts ORDER BY createdAt ASC');
};

export const addAccount = async (account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> => {
  const d = getDB();
  const id = generateId();
  const now = new Date().toISOString();
  await d.runAsync(
    'INSERT INTO accounts (id, name, type, currency, balance, createdAt) VALUES (?,?,?,?,?,?)',
    [id, account.name, account.type, account.currency, account.balance, now]
  );
  return { ...account, id, createdAt: now };
};

export const getTransactions = async (accountId?: string): Promise<Transaction[]> => {
  const d = getDB();
  if (accountId) {
    return d.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE accountId = ? ORDER BY date DESC LIMIT 50',
      [accountId]
    );
  }
  return d.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC LIMIT 50');
};

export const addTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  const d = getDB();
  const id = generateId();
  const now = new Date().toISOString();
  await d.runAsync(
    'INSERT INTO transactions (id, accountId, type, amount, category, description, date, installments, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, tx.accountId, tx.type, tx.amount, tx.category, tx.description, tx.date, tx.installments, now]
  );
  const delta = tx.type === 'income' ? tx.amount : -tx.amount;
  await d.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, tx.accountId]);
  return { ...tx, id, createdAt: now };
};

export const deleteTransaction = async (id: string, accountId: string, type: string, amount: number): Promise<void> => {
  const d = getDB();
  await d.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  const delta = type === 'income' ? -amount : amount;
  await d.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, accountId]);
};

// ─── STUDIES ──────────────────────────────────────────────────────────────────

export const getSubjects = async (): Promise<Subject[]> => {
  return getDB().getAllAsync<Subject>('SELECT * FROM subjects ORDER BY createdAt DESC');
};

export const addSubject = async (subject: { name: string; color: string }): Promise<Subject> => {
  const d = getDB();
  const id = generateId();
  const now = new Date().toISOString();
  await d.runAsync(
    'INSERT INTO subjects (id, name, color, createdAt) VALUES (?,?,?,?)',
    [id, subject.name, subject.color, now]
  );
  return { ...subject, id, createdAt: now };
};

export const deleteSubject = async (id: string): Promise<void> => {
  await getDB().runAsync('DELETE FROM subjects WHERE id = ?', [id]);
};

export const getStudySessions = async (): Promise<StudySession[]> => {
  return getDB().getAllAsync<StudySession>(`
    SELECT ss.*, s.name as subjectName
    FROM studySessions ss
    LEFT JOIN subjects s ON ss.subjectId = s.id
    ORDER BY ss.date DESC
    LIMIT 100
  `);
};

export const addStudySession = async (session: Omit<StudySession, 'id' | 'createdAt' | 'subjectName'>): Promise<StudySession> => {
  const d = getDB();
  const id = generateId();
  const now = new Date().toISOString();
  await d.runAsync(
    'INSERT INTO studySessions (id, subjectId, date, duration, focusType, createdAt) VALUES (?,?,?,?,?,?)',
    [id, session.subjectId, session.date, session.duration, session.focusType, now]
  );
  return { ...session, id, createdAt: now };
};

export const getSubjectTotalHours = async (): Promise<Record<string, number>> => {
  const rows = await getDB().getAllAsync<{ subjectId: string; total: number }>(
    'SELECT subjectId, SUM(duration) as total FROM studySessions GROUP BY subjectId'
  );
  const result: Record<string, number> = {};
  for (const r of rows) {
    result[r.subjectId] = Math.round(r.total / 60 * 10) / 10;
  }
  return result;
};
