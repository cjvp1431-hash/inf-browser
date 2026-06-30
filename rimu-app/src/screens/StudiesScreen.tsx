import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions, Text,
} from 'react-native';
import { TextInput, Button, Chip, FAB } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useStudiesStore } from '../store/studiesStore';
import { COLORS, SUBJECT_COLORS, POMODORO_DURATION, SHORT_BREAK } from '../utils/constants';
import { formatDuration, getTodayString } from '../utils/formatters';
import { Subject } from '../types';
import SubjectCard from '../components/SubjectCard';
import PomodoroTimer from '../components/PomodoroTimer';

const { width: SCREEN_W } = Dimensions.get('window');

type TimerMode = 'focus' | 'break';

const CHART_CFG = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: () => COLORS.accent,
  labelColor: () => COLORS.textSecondary,
  barPercentage: 0.6,
  decimalPlaces: 1,
};

export default function StudiesScreen() {
  const { subjects, sessions, subjectMinutes, addSubject, deleteSubject, addSession, todayMinutes, subjectHoursFormatted } = useStudiesStore();

  const [addModal, setAddModal] = useState(false);
  const [pomodoroModal, setPomodoroModal] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [subjectName, setSubjectName] = useState('');
  const [subjectColor, setSubjectColor] = useState(SUBJECT_COLORS[0]);

  // Manual session form
  const [sessionDuration, setSessionDuration] = useState('60');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionType, setSessionType] = useState<'focused' | 'pomodoro' | 'review'>('focused');

  // Pomodoro state
  const [timerSeconds, setTimerSeconds] = useState(POMODORO_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [elapsedFocus, setElapsedFocus] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleTimerEnd();
            return 0;
          }
          if (timerMode === 'focus') setElapsedFocus(e => e + 1);
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, timerMode]);

  const handleTimerEnd = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    if (timerMode === 'focus') {
      const minsFocused = Math.round(POMODORO_DURATION / 60);
      if (selectedSubject) {
        addSession({ subjectId: selectedSubject.id, date: getTodayString(), duration: minsFocused, focusType: 'pomodoro', notes: '' });
      }
      setPomodoroCount(c => c + 1);
      setTimerMode('break');
      setTimerSeconds(SHORT_BREAK);
    } else {
      setTimerMode('focus');
      setTimerSeconds(POMODORO_DURATION);
    }
  };

  const handleToggleTimer = () => setTimerRunning(r => !r);

  const handleSkipTimer = () => {
    setTimerRunning(false);
    if (timerMode === 'focus') {
      setTimerMode('break');
      setTimerSeconds(SHORT_BREAK);
    } else {
      setTimerMode('focus');
      setTimerSeconds(POMODORO_DURATION);
    }
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(timerMode === 'focus' ? POMODORO_DURATION : SHORT_BREAK);
  };

  const openPomodoro = (subject: Subject) => {
    setSelectedSubject(subject);
    setTimerMode('focus');
    setTimerSeconds(POMODORO_DURATION);
    setTimerRunning(false);
    setPomodoroCount(0);
    setElapsedFocus(0);
    setPomodoroModal(true);
  };

  const openManualSession = (subject: Subject) => {
    setSelectedSubject(subject);
    setSessionDuration('60');
    setSessionNotes('');
    setSessionType('focused');
    setSessionModal(true);
  };

  const handleAddSession = async () => {
    if (!selectedSubject) return;
    const mins = parseInt(sessionDuration) || 30;
    await addSession({ subjectId: selectedSubject.id, date: getTodayString(), duration: mins, focusType: sessionType, notes: sessionNotes.trim() });
    setSessionModal(false);
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim()) return;
    await addSubject({ name: subjectName.trim(), color: subjectColor });
    setAddModal(false);
  };

  // BarChart data (hours per subject, up to 6)
  const chartSubjects = subjects.slice(0, 6);
  const chartData = chartSubjects.length > 0
    ? {
        labels: chartSubjects.map(s => s.name.length > 6 ? s.name.slice(0, 5) + '.' : s.name),
        datasets: [{ data: chartSubjects.map(s => Math.round((subjectMinutes[s.id] || 0) / 60 * 10) / 10) }],
      }
    : null;

  const todayMins = todayMinutes();

  return (
    <View style={styles.container}>
      {/* Stats header */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{formatDuration(todayMins)}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Sesiones</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{subjects.length}</Text>
          <Text style={styles.statLabel}>Materias</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Bar chart */}
        {chartData && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Horas por materia</Text>
            <BarChart
              data={chartData}
              width={SCREEN_W - 32}
              height={160}
              chartConfig={CHART_CFG}
              style={styles.chart}
              withInnerLines={false}
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix="h"
            />
          </View>
        )}

        {/* Subjects list */}
        <Text style={styles.sectionTitle}>Materias</Text>
        {subjects.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={64} color={COLORS.border} />
            <Text style={styles.emptyText}>Sin materias</Text>
            <Text style={styles.emptySub}>Agrega tus materias de estudio</Text>
          </View>
        ) : (
          subjects.map(s => (
            <SubjectCard
              key={s.id}
              subject={s}
              hours={subjectHoursFormatted(s.id)}
              todayMins={sessions.filter(se => se.subjectId === s.id && se.date.startsWith(getTodayString())).reduce((a, se) => a + se.duration, 0)}
              onStartSession={openPomodoro}
              onDelete={deleteSubject}
            />
          ))
        )}

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Sesiones recientes</Text>
            {sessions.slice(0, 5).map(se => {
              const subject = subjects.find(s => s.id === se.subjectId);
              return (
                <View key={se.id} style={styles.sessionRow}>
                  <View style={[styles.sessionDot, { backgroundColor: subject?.color ?? COLORS.accent }]} />
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionSubject}>{se.subjectName || subject?.name || 'Materia'}</Text>
                    {se.notes ? <Text style={styles.sessionNotes} numberOfLines={1}>{se.notes}</Text> : null}
                  </View>
                  <View style={styles.sessionRight}>
                    <Text style={styles.sessionDuration}>{formatDuration(se.duration)}</Text>
                    <Text style={styles.sessionDate}>{se.date.slice(5)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.fabRow}>
        {selectedSubject && (
          <TouchableOpacity
            style={[styles.quickFab, { backgroundColor: COLORS.accent }]}
            onPress={() => openManualSession(selectedSubject)}
          >
            <Ionicons name="pencil" size={18} color="#000" />
            <Text style={[styles.quickFabText, { color: '#000' }]}>Manual</Text>
          </TouchableOpacity>
        )}
        <FAB icon="plus" style={styles.fab} color="#fff" onPress={() => setAddModal(true)} />
      </View>

      {/* Add Subject Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Nueva Materia</Text>
            <TextInput label="Nombre *" value={subjectName} onChangeText={setSubjectName} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} />
            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {SUBJECT_COLORS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, subjectColor === c && styles.colorDotSelected]} onPress={() => setSubjectColor(c)} />
              ))}
            </View>
            <View style={styles.modalActions}>
              <Button onPress={() => setAddModal(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddSubject} buttonColor={COLORS.primary}>Crear</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Pomodoro Modal */}
      <Modal visible={pomodoroModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalSheet, { paddingBottom: 60 }]}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>🍅 {selectedSubject?.name}</Text>
            <PomodoroTimer
              isRunning={timerRunning}
              mode={timerMode}
              secondsLeft={timerSeconds}
              pomodoroCount={pomodoroCount}
              elapsedFocusSecs={elapsedFocus}
              onToggle={handleToggleTimer}
              onSkip={handleSkipTimer}
              onReset={handleResetTimer}
            />
            <Button onPress={() => { setTimerRunning(false); setPomodoroModal(false); }} textColor={COLORS.textSecondary} style={{ marginTop: 16 }}>
              Cerrar
            </Button>
          </View>
        </View>
      </Modal>

      {/* Manual Session Modal */}
      <Modal visible={sessionModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>Sesión — {selectedSubject?.name}</Text>
            <TextInput label="Duración (minutos)" value={sessionDuration} onChangeText={setSessionDuration} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Tipo</Text>
            <View style={styles.chipRow}>
              {(['focused', 'pomodoro', 'review'] as const).map(t => (
                <Chip key={t} selected={sessionType === t} onPress={() => setSessionType(t)} selectedColor={COLORS.accent} compact style={{ marginRight: 6 }}>
                  {{ focused: 'Enfocado', pomodoro: '🍅 Pomodoro', review: 'Repaso' }[t]}
                </Chip>
              ))}
            </View>
            <TextInput label="Notas" value={sessionNotes} onChangeText={setSessionNotes} mode="outlined" outlineColor={COLORS.border} activeOutlineColor={COLORS.accent} style={styles.input} multiline numberOfLines={2} placeholder="¿Qué estudiaste?" />
            <View style={styles.modalActions}>
              <Button onPress={() => setSessionModal(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAddSession} buttonColor={COLORS.primary}>Guardar</Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center', gap: 3 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  statDivider: { width: 1, height: 32, backgroundColor: '#333' },
  scroll: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  chartSection: { marginBottom: 20 },
  chart: { borderRadius: 12 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  emptySub: { fontSize: 13, color: COLORS.textSecondary },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, marginBottom: 8 },
  sessionDot: { width: 10, height: 10, borderRadius: 5 },
  sessionInfo: { flex: 1 },
  sessionSubject: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  sessionNotes: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  sessionRight: { alignItems: 'flex-end' },
  sessionDuration: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  sessionDate: { fontSize: 10, color: COLORS.textSecondary },
  fabRow: { position: 'absolute', right: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fab: { backgroundColor: COLORS.primary },
  quickFab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  quickFabText: { fontWeight: '700', fontSize: 13 },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 50, gap: 12 },
  handle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#000' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
