import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal,
  KeyboardAvoidingView, Platform, ScrollView, AppState,
} from 'react-native';
import { Text, TextInput, Button, Surface, FAB, Chip, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useStudiesStore } from '../store/studiesStore';
import { COLORS, SUBJECT_COLORS, POMODORO_DURATION, SHORT_BREAK } from '../utils/constants';
import { formatDuration, formatTimerSeconds, getTodayString } from '../utils/formatters';
import { Subject } from '../database/database';

type TimerMode = 'focus' | 'break';

export default function StudiesScreen() {
  const { subjects, sessions, subjectHours, addSubject, deleteSubject, addSession, todayMinutes } = useStudiesStore();

  const [addModal, setAddModal] = useState(false);
  const [pomodoroModal, setPomodoroModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [subjectName, setSubjectName] = useState('');
  const [subjectColor, setSubjectColor] = useState(SUBJECT_COLORS[0]);

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
      setPomodoroCount(c => c + 1);
      setTimerMode('break');
      setTimerSeconds(SHORT_BREAK);
    } else {
      setTimerMode('focus');
      setTimerSeconds(POMODORO_DURATION);
    }
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerSeconds(POMODORO_DURATION);
    setTimerMode('focus');
  };

  const handleSaveSession = async () => {
    if (!selectedSubject || elapsedFocus < 60) {
      closePomodoroModal();
      return;
    }
    await addSession({
      subjectId: selectedSubject.id,
      date: getTodayString(),
      duration: Math.round(elapsedFocus / 60),
      focusType: 'pomodoro',
    });
    closePomodoroModal();
  };

  const closePomodoroModal = () => {
    resetTimer();
    setElapsedFocus(0);
    setPomodoroCount(0);
    setPomodoroModal(false);
  };

  const openPomodoro = (subject: Subject) => {
    setSelectedSubject(subject);
    setTimerSeconds(POMODORO_DURATION);
    setTimerMode('focus');
    setTimerRunning(false);
    setElapsedFocus(0);
    setPomodoroCount(0);
    setPomodoroModal(true);
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim()) return;
    await addSubject({ name: subjectName.trim(), color: subjectColor });
    setAddModal(false);
    setSubjectName('');
  };

  const totalProgress = POMODORO_DURATION > 0 ? 1 - timerSeconds / (timerMode === 'focus' ? POMODORO_DURATION : SHORT_BREAK) : 0;

  const renderSubject = ({ item }: { item: Subject }) => {
    const hours = subjectHours[item.id] || 0;
    const todaySessions = sessions.filter(s => s.subjectId === item.id && s.date.startsWith(getTodayString()));
    const todayMins = todaySessions.reduce((sum, s) => sum + s.duration, 0);

    return (
      <Surface style={styles.subjectCard} elevation={1}>
        <View style={[styles.subjectDot, { backgroundColor: item.color }]} />
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>{item.name}</Text>
          <View style={styles.subjectStats}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.subjectStatText}>{hours}h total</Text>
            {todayMins > 0 && <Text style={styles.subjectStatText}>· {formatDuration(todayMins)} hoy</Text>}
          </View>
        </View>
        <View style={styles.subjectActions}>
          <TouchableOpacity style={styles.startBtn} onPress={() => openPomodoro(item)}>
            <Ionicons name="play-circle" size={28} color={item.color} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteSubject(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      {/* Today summary */}
      <Surface style={styles.todaySummary} elevation={1}>
        <Ionicons name="book" size={20} color={COLORS.accent} />
        <Text style={styles.todaySummaryText}>
          {formatDuration(todayMinutes())} estudiados hoy · {sessions.filter(s => s.date.startsWith(getTodayString())).length} sesiones
        </Text>
      </Surface>

      <FlatList
        data={subjects}
        keyExtractor={i => i.id}
        renderItem={renderSubject}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={70} color={COLORS.border} />
            <Text style={styles.emptyText}>Agrega tu primera materia</Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={() => setAddModal(true)} />

      {/* Add Subject Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nueva Materia</Text>

            <TextInput
              label="Nombre de la materia *"
              value={subjectName}
              onChangeText={setSubjectName}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
            />

            <Text style={styles.fieldLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              {SUBJECT_COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, subjectColor === c && styles.colorDotSelected]}
                  onPress={() => setSubjectColor(c)}
                />
              ))}
            </ScrollView>

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
          <View style={[styles.modalSheet, styles.pomodoroSheet]}>
            <View style={styles.modalHandle} />
            <View style={styles.pomodoroHeader}>
              <View style={[styles.pomodoroSubjectDot, { backgroundColor: selectedSubject?.color || COLORS.accent }]} />
              <Text style={styles.pomodoroSubject}>{selectedSubject?.name}</Text>
            </View>

            <Text style={styles.pomodoroMode}>
              {timerMode === 'focus' ? '🎯 Sesión de estudio' : '☕ Descanso'}
            </Text>

            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>{formatTimerSeconds(timerSeconds)}</Text>
              <Text style={styles.timerSubtext}>
                {timerMode === 'focus' ? '25 min focus' : '5 min break'}
              </Text>
            </View>

            <ProgressBar
              progress={totalProgress}
              color={timerMode === 'focus' ? COLORS.accent : COLORS.success}
              style={styles.progressBar}
            />

            <Text style={styles.pomodoroCount}>🍅 {pomodoroCount} pomodoros completados</Text>
            <Text style={styles.pomodoroElapsed}>
              Tiempo enfocado: {formatDuration(Math.round(elapsedFocus / 60))}
            </Text>

            <View style={styles.timerBtns}>
              <TouchableOpacity style={styles.timerBtn} onPress={resetTimer}>
                <Ionicons name="refresh" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.playBtn, { backgroundColor: timerMode === 'focus' ? COLORS.accent : COLORS.success }]}
                onPress={() => setTimerRunning(r => !r)}
              >
                <Ionicons name={timerRunning ? 'pause' : 'play'} size={32} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.timerBtn} onPress={handleTimerEnd}>
                <Ionicons name="play-skip-forward" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pomodoroFooter}>
              <Button onPress={closePomodoroModal} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button
                mode="contained"
                onPress={handleSaveSession}
                buttonColor={COLORS.primary}
                disabled={elapsedFocus < 60}
              >
                Guardar sesión
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  todaySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  todaySummaryText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  list: { paddingHorizontal: 12, paddingBottom: 100, gap: 10 },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  subjectDot: { width: 14, height: 14, borderRadius: 7 },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  subjectStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  subjectStatText: { fontSize: 12, color: COLORS.textSecondary },
  subjectActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  startBtn: { padding: 2 },
  deleteBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.primary },
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    gap: 10,
  },
  pomodoroSheet: { paddingBottom: 50 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  colorRow: { maxHeight: 48, marginVertical: 4 },
  colorDot: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  colorDotSelected: { borderWidth: 3, borderColor: COLORS.primary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  pomodoroHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pomodoroSubjectDot: { width: 16, height: 16, borderRadius: 8 },
  pomodoroSubject: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  pomodoroMode: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 100,
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginVertical: 10,
  },
  timerText: { fontSize: 52, fontWeight: '800', color: COLORS.textPrimary, fontVariant: ['tabular-nums'] },
  timerSubtext: { fontSize: 13, color: COLORS.textSecondary },
  progressBar: { height: 6, borderRadius: 3 },
  pomodoroCount: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  pomodoroElapsed: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  timerBtns: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 8 },
  timerBtn: { padding: 10, backgroundColor: COLORS.surface, borderRadius: 12 },
  playBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pomodoroFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
