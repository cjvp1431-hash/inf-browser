import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, Modal,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, TextInput, Button, Surface, FAB, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useHabitsStore } from '../store/habitsStore';
import { COLORS } from '../utils/constants';
import { getTodayString } from '../utils/formatters';
import { Habit } from '../database/database';

const FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
const FREQ_LABELS: Record<string, string> = { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual' };

const LAST_30_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toISOString().split('T')[0];
});

export default function HabitsScreen() {
  const { habits, addHabit, checkIn, deleteHabit } = useHabitsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [calendarModal, setCalendarModal] = useState(false);
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<string>('daily');
  const today = getTodayString();

  const openAdd = () => {
    setTitle('');
    setFrequency('daily');
    setModalVisible(true);
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addHabit({ title: title.trim(), frequency });
    setModalVisible(false);
  };

  const handleCheckIn = async (id: string) => {
    await checkIn(id);
  };

  const openCalendar = (habit: Habit) => {
    setSelectedHabit(habit);
    setCalendarModal(true);
  };

  const renderHabit = ({ item }: { item: Habit }) => {
    const checkedToday = item.completedDates.includes(today);
    return (
      <Surface style={styles.habitCard} elevation={1}>
        <TouchableOpacity style={styles.habitMain} onPress={() => openCalendar(item)}>
          <View style={[styles.streakBadge, { backgroundColor: checkedToday ? COLORS.accent + '30' : COLORS.surface }]}>
            <Ionicons name="flame" size={18} color={checkedToday ? COLORS.accent : COLORS.textSecondary} />
            <Text style={[styles.streakNum, { color: checkedToday ? COLORS.accent : COLORS.textSecondary }]}>
              {item.currentStreak}
            </Text>
          </View>
          <View style={styles.habitInfo}>
            <Text style={styles.habitTitle}>{item.title}</Text>
            <Text style={styles.habitFreq}>{FREQ_LABELS[item.frequency]} · Récord: {item.longestStreak}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.habitActions}>
          <TouchableOpacity
            style={[styles.checkInBtn, checkedToday && styles.checkInBtnDone]}
            onPress={() => !checkedToday && handleCheckIn(item.id)}
          >
            <Ionicons
              name={checkedToday ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={28}
              color={checkedToday ? COLORS.success : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteHabit(item.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={habits}
        keyExtractor={i => i.id}
        renderItem={renderHabit}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flame-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>Agrega tu primer hábito</Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} color="#fff" onPress={openAdd} />

      {/* Add Habit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nuevo Hábito</Text>

            <TextInput
              label="Nombre del hábito *"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.accent}
            />

            <Text style={styles.fieldLabel}>Frecuencia</Text>
            <View style={styles.chipRow}>
              {FREQUENCIES.map(f => (
                <Chip
                  key={f}
                  selected={frequency === f}
                  onPress={() => setFrequency(f)}
                  selectedColor={COLORS.accent}
                  compact
                  style={styles.chip}
                >
                  {FREQ_LABELS[f]}
                </Chip>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)} textColor={COLORS.textSecondary}>Cancelar</Button>
              <Button mode="contained" onPress={handleAdd} buttonColor={COLORS.primary}>Crear</Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Calendar Modal */}
      <Modal visible={calendarModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectedHabit?.title}</Text>
            <Text style={styles.calSubtitle}>Últimos 30 días</Text>

            <View style={styles.calGrid}>
              {LAST_30_DAYS.map(day => {
                const done = selectedHabit?.completedDates.includes(day);
                const label = day.split('-')[2];
                return (
                  <View
                    key={day}
                    style={[styles.calDay, done && styles.calDayDone, day === today && styles.calDayToday]}
                  >
                    <Text style={[styles.calDayText, done && styles.calDayTextDone]}>{label}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.calStats}>
              <View style={styles.calStat}>
                <Ionicons name="flame" size={20} color={COLORS.accent} />
                <Text style={styles.calStatNum}>{selectedHabit?.currentStreak}</Text>
                <Text style={styles.calStatLabel}>Racha actual</Text>
              </View>
              <View style={styles.calStat}>
                <Ionicons name="trophy" size={20} color="#FF9800" />
                <Text style={styles.calStatNum}>{selectedHabit?.longestStreak}</Text>
                <Text style={styles.calStatLabel}>Récord</Text>
              </View>
              <View style={styles.calStat}>
                <Ionicons name="checkmark-done" size={20} color={COLORS.success} />
                <Text style={styles.calStatNum}>{selectedHabit?.completedDates.length}</Text>
                <Text style={styles.calStatLabel}>Total</Text>
              </View>
            </View>

            <Button mode="contained" onPress={() => setCalendarModal(false)} buttonColor={COLORS.primary} style={{ marginTop: 8 }}>
              Cerrar
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 12, gap: 10, paddingBottom: 100 },
  habitCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 52,
    justifyContent: 'center',
  },
  streakNum: { fontWeight: '800', fontSize: 15 },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  habitFreq: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  habitActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkInBtn: { padding: 4 },
  checkInBtnDone: { opacity: 0.7 },
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
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  input: { backgroundColor: '#fff' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {},
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  calSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: 8 },
  calDay: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calDayDone: { backgroundColor: COLORS.accent },
  calDayToday: { borderWidth: 2, borderColor: COLORS.primary },
  calDayText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  calDayTextDone: { color: '#000' },
  calStats: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  calStat: { alignItems: 'center', gap: 4 },
  calStatNum: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  calStatLabel: { fontSize: 12, color: COLORS.textSecondary },
});
