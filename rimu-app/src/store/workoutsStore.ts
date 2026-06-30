import { create } from 'zustand';
import { Workout } from '../types';
import { getWorkouts, addWorkout as dbAdd, deleteWorkout as dbDelete, getPersonalRecords } from '../database/database';
import { getTodayString } from '../utils/formatters';

interface WorkoutsState {
  workouts: Workout[];
  personalRecords: Record<string, number>;
  isLoading: boolean;
  loadWorkouts: () => Promise<void>;
  addWorkout: (w: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  todayCount: () => number;
  exerciseHistory: (name: string) => Workout[];
}

export const useWorkoutsStore = create<WorkoutsState>((set, get) => ({
  workouts: [],
  personalRecords: {},
  isLoading: false,

  loadWorkouts: async () => {
    set({ isLoading: true });
    const [workouts, personalRecords] = await Promise.all([getWorkouts(), getPersonalRecords()]);
    set({ workouts, personalRecords, isLoading: false });
  },

  addWorkout: async (data) => {
    const workout = await dbAdd(data);
    const pr = get().personalRecords;
    const newPR = data.weight > (pr[data.exerciseName] || 0);
    set(s => ({
      workouts: [workout, ...s.workouts],
      personalRecords: newPR ? { ...s.personalRecords, [data.exerciseName]: data.weight } : s.personalRecords,
    }));
  },

  deleteWorkout: async (id) => {
    await dbDelete(id);
    set(s => ({ workouts: s.workouts.filter(w => w.id !== id) }));
  },

  todayCount: () => {
    const today = getTodayString();
    return get().workouts.filter(w => w.date === today).length;
  },

  exerciseHistory: (name) =>
    get().workouts.filter(w => w.exerciseName === name).slice(0, 8).reverse(),
}));
