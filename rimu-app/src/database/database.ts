import * as SQLite from 'expo-sqlite';
import { Task, Habit, Workout, Account, Transaction, Budget, Subject, StudySession } from '../types';
import { generateId, getTodayString, calculateStreak } from '../utils/formatters';

// Re-export types for backward-compat with old imports
export type { Task, Habit, Workout, Account, Transaction, Budget, Subject, StudySession } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = (): SQLite.SQLiteDatabase => {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
};

// ── Init & Schema ─────────────────────────────────────────────────────────────

export const initDatabase = async (): Promise<void> => {
  db = await SQLite.openDatabaseAsync('rimu.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');

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
      notes TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'checking',
      currency TEXT DEFAULT 'DOP',
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
      installments INTEGER DEFAULT 0,
      installmentNumber INTEGER DEFAULT 1,
      totalInstallments INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      accountId TEXT NOT NULL,
      category TEXT NOT NULL,
      limitAmount REAL NOT NULL,
      period TEXT DEFAULT 'monthly',
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
      notes TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );
  `);

  // Additive migrations (safe to run repeatedly)
  try { await db.execAsync(`ALTER TABLE workouts ADD COLUMN notes TEXT DEFAULT '';`); } catch {}
  try { await db.execAsync(`ALTER TABLE studySessions ADD COLUMN notes TEXT DEFAULT '';`); } catch {}
  try { await db.execAsync(`ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'pending';`); } catch {}
  try {
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN installmentNumber INTEGER DEFAULT 1;`);
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN totalInstallments INTEGER DEFAULT 1;`);
  } catch {}

  await seedInitialData();
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const seedInitialData = async (): Promise<void> => {
  const d = getDB();
  const existing = await d.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM tasks');
  if (existing && existing.count > 0) return; // Already seeded

  const now = new Date().toISOString();
  const today = getTodayString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yday = yesterday.toISOString().split('T')[0];
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tmrw = tomorrow.toISOString().split('T')[0];

  // Tasks (lawyer-themed)
  const tasks: Partial<Task>[] = [
    { title: 'Completar recurso de casación', description: 'Revisar jurisprudencia del TSE sobre plazo', dueDate: today, priority: 1, status: 'pending', category: 'Trabajo' },
    { title: 'Revisar constancia anotada del cliente Méndez', description: 'Verificar número de registro en Registro de Títulos', dueDate: tmrw, priority: 2, status: 'in_progress', category: 'Trabajo' },
    { title: 'Llamar a cliente sobre audiencia', description: 'Confirmar asistencia para el jueves', dueDate: today, priority: 3, status: 'pending', category: 'Trabajo' },
    { title: 'Renovar seguro del vehículo', dueDate: tmrw, priority: 2, status: 'pending', category: 'Personal', description: '' },
    { title: 'Pagar electricidad', dueDate: today, priority: 1, status: 'pending', category: 'Finanzas', description: '' },
  ];

  for (const t of tasks) {
    await d.runAsync(
      'INSERT INTO tasks (id, title, description, dueDate, priority, status, category, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
      [generateId(), t.title!, t.description || '', t.dueDate || today, t.priority!, t.status!, t.category!, now, now]
    );
  }

  // Habits with existing streaks
  const habitList = [
    { title: 'Ejercitar 30 minutos', frequency: 'daily', streak: 15 },
    { title: 'Leer 1 hora', frequency: 'daily', streak: 8 },
    { title: 'Meditar', frequency: 'daily', streak: 3 },
  ];

  for (const h of habitList) {
    const dates: string[] = [];
    for (let i = 0; i < h.streak; i++) {
      const d2 = new Date();
      d2.setDate(d2.getDate() - i);
      dates.push(d2.toISOString().split('T')[0]);
    }
    await d.runAsync(
      'INSERT INTO habits (id, title, frequency, currentStreak, longestStreak, completedDates, createdAt) VALUES (?,?,?,?,?,?,?)',
      [generateId(), h.title, h.frequency, h.streak, h.streak, JSON.stringify(dates), now]
    );
  }

  // Workouts
  await d.runAsync(
    'INSERT INTO workouts (id, exerciseName, sets, reps, weight, weightUnit, date, notes, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
    [generateId(), 'Bench Press', 4, 8, 100, 'kg', today, 'PR personal! Nuevo máximo.', now]
  );
  await d.runAsync(
    'INSERT INTO workouts (id, exerciseName, sets, reps, weight, weightUnit, date, notes, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
    [generateId(), 'Squat', 4, 10, 120, 'kg', yday, 'Buen volumen. Peso aumentado 5kg.', now]
  );
  await d.runAsync(
    'INSERT INTO workouts (id, exerciseName, sets, reps, weight, weightUnit, date, notes, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
    [generateId(), 'Bench Press', 3, 8, 95, 'kg', yday, '', now]
  );

  // Accounts
  const acc1Id = generateId();
  const acc2Id = generateId();
  await d.runAsync(
    'INSERT INTO accounts (id, name, type, currency, balance, createdAt) VALUES (?,?,?,?,?,?)',
    [acc1Id, 'Banreservas Checking', 'checking', 'DOP', 250000, now]
  );
  await d.runAsync(
    'INSERT INTO accounts (id, name, type, currency, balance, createdAt) VALUES (?,?,?,?,?,?)',
    [acc2Id, 'Tarjeta de Crédito', 'credit', 'USD', 5000, now]
  );

  // Transactions
  await d.runAsync(
    'INSERT INTO transactions (id, accountId, type, amount, category, description, date, installments, installmentNumber, totalInstallments, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [generateId(), acc1Id, 'income', 50000, 'Salario', 'Salario mensual', yday, 0, 1, 1, now]
  );
  await d.runAsync(
    'INSERT INTO transactions (id, accountId, type, amount, category, description, date, installments, installmentNumber, totalInstallments, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [generateId(), acc1Id, 'expense', 1500, 'Comida', 'Almuerzo La Sirena', today, 0, 1, 1, now]
  );
  await d.runAsync(
    'INSERT INTO transactions (id, accountId, type, amount, category, description, date, installments, installmentNumber, totalInstallments, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [generateId(), acc1Id, 'expense', 500, 'Transporte', 'Taxi al tribunal', today, 0, 1, 1, now]
  );
  await d.runAsync(
    'INSERT INTO transactions (id, accountId, type, amount, category, description, date, installments, installmentNumber, totalInstallments, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [generateId(), acc1Id, 'expense', 1500, 'Suscripción', 'Netflix (cuota 1/2)', today, 2, 1, 2, now]
  );
  await d.runAsync(
    'INSERT INTO transactions (id, accountId, type, amount, category, description, date, installments, installmentNumber, totalInstallments, createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [generateId(), acc2Id, 'income', 1000, 'Freelance', 'Consultoría jurídica', yday, 0, 1, 1, now]
  );

  // Budgets
  await d.runAsync(
    'INSERT INTO budgets (id, accountId, category, limitAmount, period, createdAt) VALUES (?,?,?,?,?,?)',
    [generateId(), acc1Id, 'Comida', 15000, 'monthly', now]
  );
  await d.runAsync(
    'INSERT INTO budgets (id, accountId, category, limitAmount, period, createdAt) VALUES (?,?,?,?,?,?)',
    [generateId(), acc1Id, 'Transporte', 8000, 'monthly', now]
  );

  // Subjects
  const subj1 = generateId(); const subj2 = generateId(); const subj3 = generateId();
  await d.runAsync('INSERT INTO subjects (id, name, color, createdAt) VALUES (?,?,?,?)', [subj1, 'Derecho Inmobiliario', '#FF6B6B', now]);
  await d.runAsync('INSERT INTO subjects (id, name, color, createdAt) VALUES (?,?,?,?)', [subj2, 'Derecho Procesal', '#4ECDC4', now]);
  await d.runAsync('INSERT INTO subjects (id, name, color, createdAt) VALUES (?,?,?,?)', [subj3, 'Leyes Especiales', '#FFE66D', now]);

  // Study sessions
  await d.runAsync(
    'INSERT INTO studySessions (id, subjectId, date, duration, focusType, notes, createdAt) VALUES (?,?,?,?,?,?,?)',
    [generateId(), subj1, today, 50, 'pomodoro', 'Repasé artículos 1-15 de la Ley 108-05', now]
  );
  await d.runAsync(
    'INSERT INTO studySessions (id, subjectId, date, duration, focusType, notes, createdAt) VALUES (?,?,?,?,?,?,?)',
    [generateId(), subj2, yday, 90, 'focused', 'Recursos ordinarios y extraordinarios', now]
  );
  await d.runAsync(
    'INSERT INTO studySessions (id, subjectId, date, duration, focusType, notes, createdAt) VALUES (?,?,?,?,?,?,?)',
    [generateId(), subj3, yday, 30, 'review', 'Revisión de la Ley 64-00', now]
  );
};

// ── TASKS ─────────────────────────────────────────────────────────────────────

export const getTasks = async (): Promise<Task[]> =>
  getDB().getAllAsync<Task>('SELECT * FROM tasks ORDER BY priority ASC, createdAt DESC');

export const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  const d = getDB();
  const id = generateId();
  const now = new Date().toISOString();
  await d.runAsync(
    'INSERT INTO tasks (id,title,description,dueDate,priority,status,category,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, task.title, task.description || '', task.dueDate || '', task.priority, task.status || 'pending', task.category || 'Personal', now, now]
  );
  return { ...task, id, createdAt: now, updatedAt: now };
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  const now = new Date().toISOString();
  const entries = Object.entries(updates);
  if (!entries.length) return;
  const setClause = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = [...entries.map(([, v]) => v), now, id];
  await getDB().runAsync(`UPDATE tasks SET ${setClause}, updatedAt = ? WHERE id = ?`, values);
};

export const deleteTask = async (id: string): Promise<void> =>
  void getDB().runAsync('DELETE FROM tasks WHERE id = ?', [id]);

// ── HABITS ───────────────────────────────────────────────────────────────────

export const getHabits = async (): Promise<Habit[]> => {
  const rows = await getDB().getAllAsync<Omit<Habit, 'completedDates'> & { completedDates: string }>(
    'SELECT * FROM habits ORDER BY currentStreak DESC'
  );
  return rows.map(r => ({ ...r, completedDates: JSON.parse(r.completedDates || '[]') }));
};

export const addHabit = async (habit: { title: string; frequency: string }): Promise<Habit> => {
  const id = generateId();
  const now = new Date().toISOString();
  await getDB().runAsync(
    'INSERT INTO habits (id,title,frequency,currentStreak,longestStreak,completedDates,createdAt) VALUES (?,?,?,?,?,?,?)',
    [id, habit.title, habit.frequency, 0, 0, '[]', now]
  );
  return { id, title: habit.title, frequency: habit.frequency as Habit['frequency'], currentStreak: 0, longestStreak: 0, completedDates: [], createdAt: now };
};

export const checkInHabit = async (
  id: string,
  currentDates: string[]
): Promise<{ currentStreak: number; longestStreak: number; completedDates: string[] }> => {
  const today = getTodayString();
  if (currentDates.includes(today)) {
    const streak = calculateStreak(currentDates);
    return { currentStreak: streak, longestStreak: 0, completedDates: currentDates };
  }
  const newDates = [...currentDates, today];
  const newStreak = calculateStreak(newDates);
  const row = await getDB().getFirstAsync<{ longestStreak: number }>('SELECT longestStreak FROM habits WHERE id = ?', [id]);
  const newLongest = Math.max(row?.longestStreak ?? 0, newStreak);
  await getDB().runAsync(
    'UPDATE habits SET completedDates=?, currentStreak=?, longestStreak=? WHERE id=?',
    [JSON.stringify(newDates), newStreak, newLongest, id]
  );
  return { currentStreak: newStreak, longestStreak: newLongest, completedDates: newDates };
};

export const deleteHabit = async (id: string): Promise<void> =>
  void getDB().runAsync('DELETE FROM habits WHERE id = ?', [id]);

// ── WORKOUTS ──────────────────────────────────────────────────────────────────

export const getWorkouts = async (): Promise<Workout[]> =>
  getDB().getAllAsync<Workout>('SELECT * FROM workouts ORDER BY date DESC, createdAt DESC LIMIT 100');

export const addWorkout = async (w: Omit<Workout, 'id' | 'createdAt'>): Promise<Workout> => {
  const id = generateId();
  const now = new Date().toISOString();
  await getDB().runAsync(
    'INSERT INTO workouts (id,exerciseName,sets,reps,weight,weightUnit,date,notes,createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, w.exerciseName, w.sets, w.reps, w.weight, w.weightUnit, w.date, w.notes || '', now]
  );
  return { ...w, id, createdAt: now };
};

export const deleteWorkout = async (id: string): Promise<void> =>
  void getDB().runAsync('DELETE FROM workouts WHERE id = ?', [id]);

export const getPersonalRecords = async (): Promise<Record<string, number>> => {
  const rows = await getDB().getAllAsync<{ exerciseName: string; maxWeight: number }>(
    'SELECT exerciseName, MAX(weight) as maxWeight FROM workouts GROUP BY exerciseName'
  );
  return Object.fromEntries(rows.map(r => [r.exerciseName, r.maxWeight]));
};

// ── FINANCE ───────────────────────────────────────────────────────────────────

export const getAccounts = async (): Promise<Account[]> =>
  getDB().getAllAsync<Account>('SELECT * FROM accounts ORDER BY createdAt ASC');

export const addAccount = async (a: Omit<Account, 'id' | 'createdAt'>): Promise<Account> => {
  const id = generateId();
  const now = new Date().toISOString();
  await getDB().runAsync(
    'INSERT INTO accounts (id,name,type,currency,balance,createdAt) VALUES (?,?,?,?,?,?)',
    [id, a.name, a.type, a.currency, a.balance, now]
  );
  return { ...a, id, createdAt: now };
};

export const getTransactions = async (accountId?: string): Promise<Transaction[]> => {
  if (accountId) {
    return getDB().getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE accountId=? ORDER BY date DESC LIMIT 100', [accountId]
    );
  }
  return getDB().getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC LIMIT 100');
};

export const addTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  const id = generateId();
  const now = new Date().toISOString();
  await getDB().runAsync(
    'INSERT INTO transactions (id,accountId,type,amount,category,description,date,installments,installmentNumber,totalInstallments,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [id, tx.accountId, tx.type, tx.amount, tx.category, tx.description, tx.date, tx.installments || 0, tx.installmentNumber || 1, tx.totalInstallments || 1, now]
  );
  const delta = tx.type === 'income' ? tx.amount : -tx.amount;
  await getDB().runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, tx.accountId]);
  return { ...tx, id, createdAt: now };
};

export const addInstallmentTransaction = async (
  base: Omit<Transaction, 'id' | 'createdAt' | 'installmentNumber' | 'totalInstallments'>,
  totalInstallments: number
): Promise<Transaction[]> => {
  const results: Transaction[] = [];
  const perInstallment = base.amount / totalInstallments;
  for (let i = 1; i <= totalInstallments; i++) {
    const date = new Date(base.date);
    date.setMonth(date.getMonth() + (i - 1));
    const tx = await addTransaction({
      ...base,
      amount: perInstallment,
      description: `${base.description} (cuota ${i}/${totalInstallments})`,
      date: date.toISOString().split('T')[0],
      installmentNumber: i,
      totalInstallments,
    });
    if (i === 1) results.push(tx); // Only charge first installment to balance immediately
  }
  return results;
};

export const deleteTransaction = async (id: string, accountId: string, type: string, amount: number): Promise<void> => {
  await getDB().runAsync('DELETE FROM transactions WHERE id = ?', [id]);
  const delta = type === 'income' ? -amount : amount;
  await getDB().runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [delta, accountId]);
};

// ── BUDGETS ───────────────────────────────────────────────────────────────────

export const getBudgets = async (): Promise<Budget[]> =>
  getDB().getAllAsync<Budget>('SELECT * FROM budgets ORDER BY category ASC');

export const addBudget = async (b: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> => {
  const id = generateId();
  const now = new Date().toISOString();
  await getDB().runAsync(
    'INSERT INTO budgets (id,accountId,category,limitAmount,period,createdAt) VALUES (?,?,?,?,?,?)',
    [id, b.accountId, b.category, b.limitAmount, b.period, now]
  );
  return { ...b, id, createdAt: now };
};

export const deleteBudget = async (id: string): Promise<void> =>
  void getDB().runAsync('DELETE FROM budgets WHERE id = ?', [id]);

export const getMonthlySpendByCategory = async (): Promise<Record<string, number>> => {
  const d = getDB();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const start = startOfMonth.toISOString().split('T')[0];
  const rows = await d.getAllAsync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total FROM transactions WHERE type='expense' AND date >= ? GROUP BY category`,
    [start]
  );
  return Object.fromEntries(rows.map(r => [r.category, r.total]));
};

// ── STUDIES ───────────────────────────────────────────────────────────────────

export const getSubjects = async (): Promise<Subject[]> =>
  getDB().getAllAsync<Subject>('SELECT * FROM subjects ORDER BY createdAt DESC');

export const addSubject = async (s: { name: string; color: string }): Promise<Subject> => {
  const id = generateId();
  const now = new Date().toISOString();
  await getDB().runAsync('INSERT INTO subjects (id,name,color,createdAt) VALUES (?,?,?,?)', [id, s.name, s.color, now]);
  return { ...s, id, createdAt: now };
};

export const deleteSubject = async (id: string): Promise<void> =>
  void getDB().runAsync('DELETE FROM subjects WHERE id = ?', [id]);

export const getStudySessions = async (): Promise<StudySession[]> =>
  getDB().getAllAsync<StudySession>(`
    SELECT ss.*, sub.name as subjectName
    FROM studySessions ss LEFT JOIN subjects sub ON ss.subjectId = sub.id
    ORDER BY ss.date DESC LIMIT 100
  `);

export const addStudySession = async (s: Omit<StudySession, 'id' | 'createdAt' | 'subjectName'>): Promise<StudySession> => {
  const id = generateId();
  const now = new Date().toISOString();
  await getDB().runAsync(
    'INSERT INTO studySessions (id,subjectId,date,duration,focusType,notes,createdAt) VALUES (?,?,?,?,?,?,?)',
    [id, s.subjectId, s.date, s.duration, s.focusType, s.notes || '', now]
  );
  return { ...s, id, createdAt: now };
};

export const getSubjectTotalMinutes = async (): Promise<Record<string, number>> => {
  const rows = await getDB().getAllAsync<{ subjectId: string; total: number }>(
    'SELECT subjectId, SUM(duration) as total FROM studySessions GROUP BY subjectId'
  );
  return Object.fromEntries(rows.map(r => [r.subjectId, r.total]));
};
