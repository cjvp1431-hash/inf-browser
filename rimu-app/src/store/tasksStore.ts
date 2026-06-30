import { create } from 'zustand';
import { Task, getTasks, addTask as dbAddTask, updateTask as dbUpdateTask, deleteTask as dbDeleteTask } from '../database/database';
import { getTodayString } from '../utils/formatters';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  filter: 'all' | 'pending' | 'completed';
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setFilter: (filter: 'all' | 'pending' | 'completed') => void;
  todayCount: () => number;
  completedTodayCount: () => number;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  isLoading: false,
  filter: 'all',

  loadTasks: async () => {
    set({ isLoading: true });
    const tasks = await getTasks();
    set({ tasks, isLoading: false });
  },

  addTask: async (taskData) => {
    const task = await dbAddTask(taskData);
    set(state => ({ tasks: [task, ...state.tasks] }));
  },

  updateTask: async (id, updates) => {
    await dbUpdateTask(id, updates);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  },

  completeTask: async (id) => {
    await dbUpdateTask(id, { status: 'completed' });
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'completed' } : t),
    }));
  },

  deleteTask: async (id) => {
    await dbDeleteTask(id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  setFilter: (filter) => set({ filter }),

  todayCount: () => {
    const today = getTodayString();
    return get().tasks.filter(t => t.status === 'pending' && (t.dueDate?.startsWith(today) || !t.dueDate)).length;
  },

  completedTodayCount: () => {
    const today = getTodayString();
    return get().tasks.filter(t => t.status === 'completed' && t.updatedAt?.startsWith(today)).length;
  },
}));
