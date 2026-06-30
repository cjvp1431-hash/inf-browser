import { create } from 'zustand';
import { Subject, StudySession } from '../types';
import {
  getSubjects, addSubject as dbAdd, deleteSubject as dbDelete,
  getStudySessions, addStudySession as dbAddSession,
  getSubjectTotalMinutes,
} from '../database/database';
import { getTodayString } from '../utils/formatters';

interface StudiesState {
  subjects: Subject[];
  sessions: StudySession[];
  subjectMinutes: Record<string, number>;
  isLoading: boolean;
  loadAll: () => Promise<void>;
  addSubject: (s: { name: string; color: string }) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addSession: (s: Omit<StudySession, 'id' | 'createdAt' | 'subjectName'>) => Promise<void>;
  todayMinutes: () => number;
  subjectHoursFormatted: (id: string) => string;
}

export const useStudiesStore = create<StudiesState>((set, get) => ({
  subjects: [],
  sessions: [],
  subjectMinutes: {},
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true });
    const [subjects, sessions, subjectMinutes] = await Promise.all([
      getSubjects(), getStudySessions(), getSubjectTotalMinutes(),
    ]);
    set({ subjects, sessions, subjectMinutes, isLoading: false });
  },

  addSubject: async (data) => {
    const s = await dbAdd(data);
    set(st => ({ subjects: [s, ...st.subjects] }));
  },

  deleteSubject: async (id) => {
    await dbDelete(id);
    set(st => ({ subjects: st.subjects.filter(s => s.id !== id) }));
  },

  addSession: async (data) => {
    const session = await dbAddSession(data);
    const subject = get().subjects.find(s => s.id === data.subjectId);
    set(st => ({
      sessions: [{ ...session, subjectName: subject?.name ?? '' }, ...st.sessions],
      subjectMinutes: {
        ...st.subjectMinutes,
        [data.subjectId]: (st.subjectMinutes[data.subjectId] || 0) + data.duration,
      },
    }));
  },

  todayMinutes: () => {
    const today = getTodayString();
    return get().sessions.filter(s => s.date.startsWith(today)).reduce((sum, s) => sum + s.duration, 0);
  },

  subjectHoursFormatted: (id) => {
    const mins = get().subjectMinutes[id] || 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'min' : ''}`.trim() : `${m}min`;
  },
}));
