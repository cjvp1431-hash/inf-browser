import { create } from 'zustand';
import { Habit, getHabits, addHabit as dbAddHabit, checkInHabit as dbCheckIn, deleteHabit as dbDeleteHabit } from '../database/database';
import { getTodayString } from '../utils/formatters';

interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  loadHabits: () => Promise<void>;
  addHabit: (habit: { title: string; frequency: string }) => Promise<void>;
  checkIn: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  checkedTodayCount: () => number;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,

  loadHabits: async () => {
    set({ isLoading: true });
    const habits = await getHabits();
    set({ habits, isLoading: false });
  },

  addHabit: async (habitData) => {
    const habit = await dbAddHabit(habitData);
    set(state => ({ habits: [habit, ...state.habits] }));
  },

  checkIn: async (id) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;
    const result = await dbCheckIn(id, habit.completedDates);
    set(state => ({
      habits: state.habits.map(h =>
        h.id === id
          ? { ...h, currentStreak: result.currentStreak, longestStreak: result.longestStreak, completedDates: result.completedDates }
          : h
      ),
    }));
  },

  deleteHabit: async (id) => {
    await dbDeleteHabit(id);
    set(state => ({ habits: state.habits.filter(h => h.id !== id) }));
  },

  checkedTodayCount: () => {
    const today = getTodayString();
    return get().habits.filter(h => h.completedDates.includes(today)).length;
  },
}));
