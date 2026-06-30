import { create } from 'zustand';
import { Task, TaskFilter } from '../types';
import { getTasks, addTask as dbAdd, updateTask as dbUpdate, deleteTask as dbDelete } from '../database/database';
import { getTodayString } from '../utils/formatters';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  filter: TaskFilter;
  searchQuery: string;
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  setStatus: (id: string, status: Task['status']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilter: (filter: TaskFilter) => void;
  setSearch: (q: string) => void;
  filteredTasks: () => Task[];
  todayPendingCount: () => number;
  completedTodayCount: () => number;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  filter: 'all',
  searchQuery: '',

  loadTasks: async () => {
    set({ isLoading: true });
    const tasks = await getTasks();
    set({ tasks, isLoading: false });
  },

  addTask: async (data) => {
    const task = await dbAdd(data);
    set(s => ({ tasks: [task, ...s.tasks] }));
  },

  updateTask: async (id, updates) => {
    await dbUpdate(id, updates);
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  },

  setStatus: async (id, status) => {
    await dbUpdate(id, { status });
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, status } : t) }));
  },

  deleteTask: async (id) => {
    await dbDelete(id);
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }));
  },

  setFilter: (filter) => set({ filter }),
  setSearch: (searchQuery) => set({ searchQuery }),

  filteredTasks: () => {
    const { tasks, filter, searchQuery } = get();
    let result = tasks;
    if (filter !== 'all') result = result.filter(t => t.status === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return result;
  },

  todayPendingCount: () => {
    const today = getTodayString();
    return get().tasks.filter(t => t.status === 'pending' && t.dueDate?.startsWith(today)).length;
  },

  completedTodayCount: () => {
    const today = getTodayString();
    return get().tasks.filter(t => t.status === 'completed' && t.updatedAt?.startsWith(today)).length;
  },
}));
