import { create } from 'zustand';
import { Habit } from '../types';
import { getHabits, addHabit as dbAdd, checkInHabit as dbCheckIn, deleteHabit as dbDelete } from '../database/database';
import { getTodayString } from '../utils/formatters';

interface HabitsState {
  habits: Habit[];
  isLoading: boolean;
  loadHabits: () => Promise<void>;
  addHabit: (habit: { title: string; frequency: string }) => Promise<void>;
  checkIn: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  checkedTodayCount: () => number;
  monthlyCompletionRate: () => number;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,

  loadHabits: async () => {
    set({ isLoading: true });
    const habits = await getHabits();
    set({ habits, isLoading: false });
  },

  addHabit: async (data) => {
    const habit = await dbAdd(data);
    set(s => ({ habits: [habit, ...s.habits] }));
  },

  checkIn: async (id) => {
    const habit = get().habits.find(h => h.id === id);
    if (!habit) return;
    const result = await dbCheckIn(id, habit.completedDates);
    set(s => ({
      habits: s.habits.map(h =>
        h.id === id
          ? { ...h, currentStreak: result.currentStreak, longestStreak: Math.max(h.longestStreak, result.longestStreak), completedDates: result.completedDates }
          : h
      ),
    }));
  },

  deleteHabit: async (id) => {
    await dbDelete(id);
    set(s => ({ habits: s.habits.filter(h => h.id !== id) }));
  },

  checkedTodayCount: () => {
    const today = getTodayString();
    return get().habits.filter(h => h.completedDates.includes(today)).length;
  },

  monthlyCompletionRate: () => {
    const { habits } = get();
    if (!habits.length) return 0;
    const now = new Date();
    const daysInMonth = now.getDate();
    let totalPossible = habits.length * daysInMonth;
    let totalDone = 0;
    for (let i = 0; i < daysInMonth; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      for (const h of habits) {
        if (h.completedDates.includes(ds)) totalDone++;
      }
    }
    return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
  },
}));
