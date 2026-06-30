import { create } from 'zustand';
import {
  Subject, StudySession,
  getSubjects, addSubject as dbAddSubject, deleteSubject as dbDeleteSubject,
  getStudySessions, addStudySession as dbAddSession,
  getSubjectTotalHours,
} from '../database/database';
import { getTodayString } from '../utils/formatters';

interface StudiesState {
  subjects: Subject[];
  sessions: StudySession[];
  subjectHours: Record<string, number>;
  isLoading: boolean;
  loadAll: () => Promise<void>;
  addSubject: (subject: { name: string; color: string }) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addSession: (session: Omit<StudySession, 'id' | 'createdAt' | 'subjectName'>) => Promise<void>;
  todayMinutes: () => number;
}

export const useStudiesStore = create<StudiesState>((set, get) => ({
  subjects: [],
  sessions: [],
  subjectHours: {},
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true });
    const [subjects, sessions, subjectHours] = await Promise.all([
      getSubjects(),
      getStudySessions(),
      getSubjectTotalHours(),
    ]);
    set({ subjects, sessions, subjectHours, isLoading: false });
  },

  addSubject: async (subjectData) => {
    const subject = await dbAddSubject(subjectData);
    set(state => ({ subjects: [subject, ...state.subjects] }));
  },

  deleteSubject: async (id) => {
    await dbDeleteSubject(id);
    set(state => ({ subjects: state.subjects.filter(s => s.id !== id) }));
  },

  addSession: async (sessionData) => {
    const session = await dbAddSession(sessionData);
    const subject = get().subjects.find(s => s.id === sessionData.subjectId);
    const fullSession = { ...session, subjectName: subject?.name || '' };
    set(state => ({
      sessions: [fullSession, ...state.sessions],
      subjectHours: {
        ...state.subjectHours,
        [sessionData.subjectId]: (state.subjectHours[sessionData.subjectId] || 0) + Math.round(sessionData.duration / 60 * 10) / 10,
      },
    }));
  },

  todayMinutes: () => {
    const today = getTodayString();
    return get().sessions
      .filter(s => s.date.startsWith(today))
      .reduce((sum, s) => sum + s.duration, 0);
  },
}));
