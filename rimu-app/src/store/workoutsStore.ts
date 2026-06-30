import { create } from 'zustand';
import { Workout, getWorkouts, addWorkout as dbAddWorkout, deleteWorkout as dbDeleteWorkout } from '../database/database';
import { getTodayString } from '../utils/formatters';

interface WorkoutsState {
  workouts: Workout[];
  isLoading: boolean;
  loadWorkouts: () => Promise<void>;
  addWorkout: (workout: Omit<Workout, 'id' | 'createdAt'>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  todayCount: () => number;
}

export const useWorkoutsStore = create<WorkoutsState>((set, get) => ({
  workouts: [],
  isLoading: false,

  loadWorkouts: async () => {
    set({ isLoading: true });
    const workouts = await getWorkouts();
    set({ workouts, isLoading: false });
  },

  addWorkout: async (workoutData) => {
    const workout = await dbAddWorkout(workoutData);
    set(state => ({ workouts: [workout, ...state.workouts] }));
  },

  deleteWorkout: async (id) => {
    await dbDeleteWorkout(id);
    set(state => ({ workouts: state.workouts.filter(w => w.id !== id) }));
  },

  todayCount: () => {
    const today = getTodayString();
    return get().workouts.filter(w => w.date === today).length;
  },
}));
